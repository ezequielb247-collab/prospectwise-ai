-- Sprint 5 corrective migration: authenticated may reach private tables,
-- while RLS remains the authority that decides which rows are visible/writable.
grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on table
  public.profiles,
  public.campaigns,
  public.leads,
  public.lead_analyses,
  public.messages,
  public.message_attempts,
  public.conversations,
  public.crm_activities,
  public.opt_outs,
  public.provider_settings,
  public.app_settings
to authenticated, service_role;

-- Anonymous visitors receive no private-table privileges.
revoke all on table
  public.profiles,
  public.campaigns,
  public.leads,
  public.lead_analyses,
  public.messages,
  public.message_attempts,
  public.conversations,
  public.crm_activities,
  public.opt_outs,
  public.provider_settings,
  public.app_settings
from anon;

-- UUID primary keys are used today. If an owned sequence exists after a future
-- compatible alteration, grant only sequences owned by the private tables.
do $$
declare sequence_record record;
begin
  for sequence_record in
    select distinct ns.nspname as schema_name, seq.relname as sequence_name
    from pg_class seq
    join pg_namespace ns on ns.oid = seq.relnamespace
    join pg_depend dep on dep.objid = seq.oid and dep.deptype in ('a','i')
    join pg_class tbl on tbl.oid = dep.refobjid
    where seq.relkind = 'S'
      and ns.nspname = 'public'
      and tbl.relname = any(array['profiles','campaigns','leads','lead_analyses','messages','message_attempts','conversations','crm_activities','opt_outs','provider_settings','app_settings'])
  loop
    execute format('grant usage, select on sequence %I.%I to authenticated',sequence_record.schema_name,sequence_record.sequence_name);
    execute format('grant usage, select on sequence %I.%I to service_role',sequence_record.schema_name,sequence_record.sequence_name);
    execute format('revoke all on sequence %I.%I from anon',sequence_record.schema_name,sequence_record.sequence_name);
  end loop;
end $$;

-- Harden the signup trigger. The empty search_path prevents object shadowing;
-- every referenced object is fully qualified.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id,email,name)
  values(new.id,coalesce(new.email,''),new.raw_user_meta_data->>'name')
  on conflict(id) do update
    set email=excluded.email,
        name=coalesce(excluded.name,public.profiles.name),
        updated_at=now();
  return new;
exception when others then
  raise log 'handle_new_user failed: sqlstate=%, message=%', sqlstate, sqlerrm;
  raise;
end
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

-- Backfill users created before the corrected trigger without overwriting
-- profile ownership or mixing users.
insert into public.profiles(id,email,name)
select users.id,coalesce(users.email,''),users.raw_user_meta_data->>'name'
from auth.users as users
on conflict(id) do update
set email=excluded.email,
    name=coalesce(excluded.name,public.profiles.name),
    updated_at=now();

-- Fail the migration if RLS was accidentally disabled on any private table.
do $$
declare missing_rls text;
begin
  select string_agg(cls.relname,', ' order by cls.relname) into missing_rls
  from pg_class cls
  join pg_namespace ns on ns.oid=cls.relnamespace
  where ns.nspname='public'
    and cls.relname=any(array['profiles','campaigns','leads','lead_analyses','messages','message_attempts','conversations','crm_activities','opt_outs','provider_settings','app_settings'])
    and not cls.relrowsecurity;
  if missing_rls is not null then
    raise exception 'RLS disabled on private tables: %',missing_rls;
  end if;
end $$;

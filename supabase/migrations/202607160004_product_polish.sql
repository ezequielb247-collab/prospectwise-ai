alter table public.leads add column if not exists notes text;

do $$
declare constraint_name text;
begin
  select conname into constraint_name from pg_constraint
  where conrelid='public.crm_activities'::regclass and contype='f'
    and confrelid='public.leads'::regclass limit 1;
  if constraint_name is not null then execute format('alter table public.crm_activities drop constraint %I',constraint_name); end if;
end $$;
alter table public.crm_activities alter column lead_id drop not null;
alter table public.crm_activities add constraint crm_activities_lead_owner_fk
  foreign key(lead_id,user_id) references public.leads(id,user_id) on delete set null (lead_id);
create index if not exists leads_user_filter_idx on public.leads(user_id,campaign_id,crm_stage,city,state,category,created_at desc);

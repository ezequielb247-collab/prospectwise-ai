create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, category text, service text, type text not null, channel text not null,
  content text not null, active boolean not null default true, version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
alter table public.messages add column if not exists template_id uuid;
alter table public.messages add column if not exists type text not null default 'first_contact';
alter table public.messages add column if not exists channel text not null default 'manual';
alter table public.messages add column if not exists subject text;
alter table public.messages add column if not exists version integer not null default 1;
alter table public.messages add column if not exists responded_at timestamptz;
alter table public.messages add column if not exists warnings jsonb not null default '[]'::jsonb;
update public.messages set status=case status when 'Rascunho' then 'draft' when 'Preparada' then 'prepared' when 'Aprovada' then 'approved' when 'Agendada' then 'scheduled' when 'Enviada' then 'sent' when 'Respondida' then 'responded' when 'Falhou' then 'failed' when 'Cancelada' then 'cancelled' else lower(status) end;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='messages_template_owner_fk') then alter table public.messages add constraint messages_template_owner_fk foreign key(template_id,user_id) references public.message_templates(id,user_id) on delete set null (template_id); end if;
 if not exists(select 1 from pg_constraint where conname='messages_status_check') then alter table public.messages add constraint messages_status_check check(status in ('draft','prepared','approved','scheduled','queued','sent','delivered','responded','failed','cancelled')); end if;
 if not exists(select 1 from pg_constraint where conname='messages_type_check') then alter table public.messages add constraint messages_type_check check(type in ('first_contact','follow_up_1','follow_up_2','portfolio','meeting_invite','proposal','closing','opt_out_confirmation')); end if;
 if not exists(select 1 from pg_constraint where conname='messages_channel_check') then alter table public.messages add constraint messages_channel_check check(channel in ('whatsapp','email','manual')); end if;
end $$;
alter table public.crm_activities add column if not exists message_id uuid;
alter table public.crm_activities add column if not exists metadata jsonb not null default '{}'::jsonb;
do $$ begin if not exists(select 1 from pg_constraint where conname='crm_activities_message_owner_fk') then alter table public.crm_activities add constraint crm_activities_message_owner_fk foreign key(message_id,user_id) references public.messages(id,user_id) on delete set null (message_id); end if; end $$;
alter table public.message_templates enable row level security;
drop policy if exists own_rows on public.message_templates;
create policy own_rows on public.message_templates for all using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.message_templates to authenticated,service_role;
create index if not exists message_templates_user_active_idx on public.message_templates(user_id,active,type,channel);
create index if not exists messages_panel_idx on public.messages(user_id,campaign_id,status,channel,type,created_at desc);
create index if not exists crm_activities_message_idx on public.crm_activities(user_id,message_id,created_at desc);

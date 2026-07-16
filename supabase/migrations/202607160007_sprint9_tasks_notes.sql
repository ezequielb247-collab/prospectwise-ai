alter table public.leads add column if not exists favorite boolean not null default false;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null,
  campaign_id uuid,
  title text not null check (char_length(title) between 1 and 180),
  description text,
  type text not null check (type in ('ligacao','proposta','follow_up','reuniao','visita','orcamento','personalizada')),
  priority text not null default 'media' check (priority in ('baixa','media','alta','urgente')),
  scheduled_for timestamptz not null,
  status text not null default 'pendente' check (status in ('pendente','hoje','atrasada','concluida','cancelada')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id),
  foreign key(lead_id,user_id) references public.leads(id,user_id) on delete cascade,
  foreign key(campaign_id,user_id) references public.campaigns(id,user_id) on delete set null (campaign_id)
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null,
  text text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,user_id),
  foreign key(lead_id,user_id) references public.leads(id,user_id) on delete cascade
);

create index if not exists tasks_agenda_idx on public.tasks(user_id,status,scheduled_for);
create index if not exists tasks_lead_idx on public.tasks(user_id,lead_id,created_at desc);
create index if not exists tasks_campaign_idx on public.tasks(user_id,campaign_id,scheduled_for);
create index if not exists lead_notes_timeline_idx on public.lead_notes(user_id,lead_id,created_at desc);
create index if not exists leads_favorite_idx on public.leads(user_id,favorite) where favorite=true;

alter table public.tasks enable row level security;
alter table public.lead_notes enable row level security;
drop policy if exists own_rows on public.tasks;
create policy own_rows on public.tasks for all using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists own_rows on public.lead_notes;
create policy own_rows on public.lead_notes for all using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.tasks,public.lead_notes from anon;
grant select,insert,update,delete on public.tasks,public.lead_notes to authenticated,service_role;

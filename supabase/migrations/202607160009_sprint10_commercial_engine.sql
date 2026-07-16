begin;

alter table public.lead_analyses add column if not exists positive_factors jsonb not null default '[]'::jsonb;
alter table public.lead_analyses add column if not exists negative_factors jsonb not null default '[]'::jsonb;
alter table public.lead_analyses add column if not exists confidence integer not null default 0 check (confidence between 0 and 100);

create table if not exists public.lead_digital_presence (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null, website_status text not null default 'unknown' check(website_status in ('present','absent','unknown')),
  website_url text, domain text, https_enabled boolean, mobile_friendly boolean, contact_form_present boolean,
  whatsapp_present boolean, instagram_url text, facebook_url text, google_maps_url text, google_rating numeric(2,1),
  google_reviews integer, google_business_status text not null default 'unknown', last_checked_at timestamptz,
  source text not null default 'manual', confidence integer not null default 0 check(confidence between 0 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id), unique(user_id,lead_id),
  foreign key(lead_id,user_id) references public.leads(id,user_id) on delete cascade
);
create table if not exists public.prospect_lists (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid, name text not null check(char_length(name) between 1 and 120), description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
  foreign key(campaign_id,user_id) references public.campaigns(id,user_id) on delete set null (campaign_id)
);
create table if not exists public.prospect_list_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null, lead_id uuid not null, position integer, created_at timestamptz not null default now(), unique(id,user_id), unique(user_id,list_id,lead_id),
  foreign key(list_id,user_id) references public.prospect_lists(id,user_id) on delete cascade,
  foreign key(lead_id,user_id) references public.leads(id,user_id) on delete cascade
);
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null, lead_id uuid not null, status text not null default 'draft' check(status in ('draft','ready','sent_manual','accepted','rejected','expired','cancelled')),
  title text not null, summary text not null default '', problem_statement text not null default '', solution text not null default '',
  scope text not null default '', deliverables jsonb not null default '[]', timeline_text text not null default '', price numeric(12,2),
  payment_terms text not null default '', validity_date date, notes text, version integer not null default 1,
  approved_at timestamptz, sent_at timestamptz, accepted_at timestamptz, rejected_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
  foreign key(campaign_id,user_id) references public.campaigns(id,user_id), foreign key(lead_id,user_id) references public.leads(id,user_id)
);
create table if not exists public.response_templates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null, title text not null, body text not null, favorite boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table if not exists public.contact_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null, lead_id uuid not null, message_id uuid, channel text not null check(channel in ('whatsapp','manual','phone','email')),
  result text not null, contacted_at timestamptz not null default now(), created_at timestamptz not null default now(), unique(id,user_id),
  foreign key(campaign_id,user_id) references public.campaigns(id,user_id), foreign key(lead_id,user_id) references public.leads(id,user_id),
  foreign key(message_id,user_id) references public.messages(id,user_id) on delete set null (message_id)
);
create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  completed_steps jsonb not null default '[]', dismissed boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists professional_name text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists logo_url text;
alter table public.profiles add column if not exists pix_key text;
alter table public.profiles add column if not exists commercial_notes text;
alter table public.app_settings add column if not exists default_cta text;
alter table public.app_settings add column if not exists message_signature text;
alter table public.app_settings add column if not exists base_city text;
alter table public.app_settings add column if not exists timezone text not null default 'America/Sao_Paulo';
alter table public.app_settings add column if not exists default_provider text not null default 'csv';
alter table public.app_settings add column if not exists automatic_analysis boolean not null default true;
alter table public.app_settings add column if not exists open_radar_after_import boolean not null default true;
alter table public.app_settings add column if not exists offered_services jsonb not null default '[]';
alter table public.app_settings add column if not exists default_prices jsonb not null default '{}';
alter table public.app_settings add column if not exists feature_flags jsonb not null default '{"google_places_enabled":false,"outscraper_enabled":false,"deterministic_messages_v2":true,"proposals_enabled":true,"manual_prospecting_enabled":true}'::jsonb;
alter table public.messages add column if not exists variant text check(variant in ('A','B'));

do $$ begin
  if not exists(select 1 from pg_constraint where conname='leads_campaign_owner_unique') then
    alter table public.leads add constraint leads_campaign_owner_unique unique(id,campaign_id,user_id);
  end if;
  if not exists(select 1 from pg_constraint where conname='proposals_lead_campaign_owner_fk') then
    alter table public.proposals add constraint proposals_lead_campaign_owner_fk foreign key(lead_id,campaign_id,user_id) references public.leads(id,campaign_id,user_id);
  end if;
  if not exists(select 1 from pg_constraint where conname='contact_attempts_lead_campaign_owner_fk') then
    alter table public.contact_attempts add constraint contact_attempts_lead_campaign_owner_fk foreign key(lead_id,campaign_id,user_id) references public.leads(id,campaign_id,user_id);
  end if;
end $$;

do $$ declare t text; begin foreach t in array array['lead_digital_presence','prospect_lists','prospect_list_items','proposals','response_templates','contact_attempts','onboarding_progress'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists own_rows on public.%I',t);
  if t='onboarding_progress' then execute 'create policy own_rows on public.onboarding_progress for all using(user_id=auth.uid()) with check(user_id=auth.uid())';
  else execute format('create policy own_rows on public.%I for all using(user_id=auth.uid()) with check(user_id=auth.uid())',t); end if;
  execute format('revoke all on public.%I from anon',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated,service_role',t);
end loop; end $$;
create index if not exists prospect_lists_user_idx on public.prospect_lists(user_id,created_at desc);
create index if not exists prospect_list_items_list_idx on public.prospect_list_items(user_id,list_id,position);
create index if not exists digital_presence_lead_idx on public.lead_digital_presence(user_id,lead_id);
create index if not exists proposals_pipeline_idx on public.proposals(user_id,status,created_at desc);
create index if not exists contact_attempts_daily_idx on public.contact_attempts(user_id,contacted_at desc);
commit;

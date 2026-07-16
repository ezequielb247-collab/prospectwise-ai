alter table public.leads add column if not exists provider text not null default 'legacy';
alter table public.leads add column if not exists instagram text;
alter table public.leads add column if not exists facebook text;

create index if not exists leads_user_phone_idx on public.leads(user_id,phone) where phone is not null;
create index if not exists leads_user_name_city_idx on public.leads(user_id,lower(name),lower(city));
create index if not exists leads_user_maps_url_idx on public.leads(user_id,maps_url) where maps_url is not null;

create or replace function public.import_csv_leads(p_campaign_id uuid,p_leads jsonb)
returns table(lead_id uuid)
language plpgsql
security invoker
set search_path=''
as $$
declare item jsonb;new_id uuid;current_user_id uuid:=auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not exists(select 1 from public.campaigns where id=p_campaign_id and user_id=current_user_id) then raise exception 'Campaign not found' using errcode='P0002'; end if;
  for item in select value from jsonb_array_elements(p_leads)
  loop
    if nullif(trim(item->>'name'),'') is null then continue; end if;
    if exists(
      select 1 from public.leads existing
      where existing.user_id=current_user_id and (
        (nullif(item->>'phone','') is not null and existing.phone=item->>'phone') or
        (nullif(item->>'website','') is not null and lower(split_part(regexp_replace(existing.website,'^https?://(www\.)?','','i'), '/', 1))=lower(split_part(regexp_replace(item->>'website','^https?://(www\.)?','','i'), '/', 1))) or
        (nullif(item->>'city','') is not null and lower(trim(existing.name))=lower(trim(item->>'name')) and lower(trim(coalesce(existing.city,'')))=lower(trim(item->>'city'))) or
        (nullif(item->>'address','') is not null and lower(regexp_replace(coalesce(existing.address,''),'\W','','g'))=lower(regexp_replace(item->>'address','\W','','g'))) or
        (nullif(item->>'mapsUrl','') is not null and existing.maps_url=item->>'mapsUrl')
      )
    ) then continue; end if;
    new_id:=gen_random_uuid();
    insert into public.leads(id,user_id,campaign_id,name,phone,website,address,city,state,category,rating,reviews,maps_url,instagram,facebook,provider,crm_stage)
    values(new_id,current_user_id,p_campaign_id,item->>'name',nullif(item->>'phone',''),nullif(item->>'website',''),nullif(item->>'address',''),nullif(item->>'city',''),nullif(item->>'state',''),nullif(item->>'category',''),nullif(item->>'rating','')::numeric,nullif(item->>'reviews','')::integer,nullif(item->>'mapsUrl',''),nullif(item->>'instagram',''),nullif(item->>'facebook',''),'csv_import','Novo');
    insert into public.crm_activities(user_id,campaign_id,lead_id,type,note)
    values(current_user_id,p_campaign_id,new_id,'lead_imported','Empresa importada por CSV.');
    lead_id:=new_id;return next;
  end loop;
end $$;

revoke all on function public.import_csv_leads(uuid,jsonb) from public,anon;
grant execute on function public.import_csv_leads(uuid,jsonb) to authenticated,service_role;

begin;

drop function if exists public.import_csv_leads(uuid, jsonb);

create function public.import_csv_leads(
  p_campaign_id uuid,
  p_leads jsonb
)
returns table(lead_id uuid, imported_count integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  item jsonb;
  item_number bigint;
  new_id uuid;
  inserted_ids uuid[] := '{}';
  insert_columns text;
  insert_values text;
  has_rating boolean;
  has_reviews boolean;
  has_provider boolean;
  has_instagram boolean;
  has_facebook boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_leads) <> 'array' then
    raise exception 'p_leads must be a JSON array' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.campaigns
    where id = p_campaign_id
      and user_id = current_user_id
  ) then
    raise exception 'Campaign not found' using errcode = 'P0002';
  end if;

  select
    exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'rating'),
    exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'reviews'),
    exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'provider'),
    exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'instagram'),
    exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'facebook')
  into has_rating, has_reviews, has_provider, has_instagram, has_facebook;

  for item, item_number in
    select value, ordinality
    from jsonb_array_elements(p_leads) with ordinality
  loop
    if jsonb_typeof(item) <> 'object' then
      raise exception 'Lead at position % must be a JSON object', item_number using errcode = '22023';
    end if;

    if nullif(trim(item ->> 'name'), '') is null then
      raise exception 'Lead at position % has no name', item_number using errcode = '23502';
    end if;

    new_id := gen_random_uuid();
    insert_columns := 'id,user_id,campaign_id,name,phone,website,address,city,state,category,maps_url,crm_stage';
    insert_values := '$1,$2,$3,trim($4->>''name''),nullif($4->>''phone'',''''),nullif($4->>''website'',''''),nullif($4->>''address'',''''),nullif($4->>''city'',''''),nullif($4->>''state'',''''),nullif($4->>''category'',''''),nullif($4->>''mapsUrl'',''''),''new''';

    if has_rating then
      insert_columns := insert_columns || ',rating';
      insert_values := insert_values || ',nullif($4->>''rating'','''')::numeric';
    end if;
    if has_reviews then
      insert_columns := insert_columns || ',reviews';
      insert_values := insert_values || ',nullif($4->>''reviews'','''')::integer';
    end if;
    if has_provider then
      insert_columns := insert_columns || ',provider';
      insert_values := insert_values || ',''csv_import''';
    end if;
    if has_instagram then
      insert_columns := insert_columns || ',instagram';
      insert_values := insert_values || ',nullif($4->>''instagram'','''')';
    end if;
    if has_facebook then
      insert_columns := insert_columns || ',facebook';
      insert_values := insert_values || ',nullif($4->>''facebook'','''')';
    end if;

    execute format('insert into public.leads(%s) values(%s)', insert_columns, insert_values)
      using new_id, current_user_id, p_campaign_id, item;

    insert into public.crm_activities(user_id, campaign_id, lead_id, type, note)
    values(current_user_id, p_campaign_id, new_id, 'lead_imported', 'Empresa importada por CSV.');

    inserted_ids := array_append(inserted_ids, new_id);
  end loop;

  return query
    select imported_id, cardinality(inserted_ids)
    from unnest(inserted_ids) as imported(imported_id);
end;
$$;

revoke all on function public.import_csv_leads(uuid, jsonb) from public;
revoke all on function public.import_csv_leads(uuid, jsonb) from anon;
grant execute on function public.import_csv_leads(uuid, jsonb) to authenticated;
grant execute on function public.import_csv_leads(uuid, jsonb) to service_role;

commit;

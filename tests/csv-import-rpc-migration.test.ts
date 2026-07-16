import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

const migration=()=>readFile(new URL("../supabase/migrations/202607160008_fix_import_csv_rpc.sql",import.meta.url),"utf8");

test("usuário autenticado importa leads e recebe quantidade",async()=>{
  const sql=await migration();
  assert.match(sql,/current_user_id uuid := auth\.uid\(\)/);
  assert.match(sql,/returns table\(lead_id uuid, imported_count integer\)/);
  assert.match(sql,/cardinality\(inserted_ids\)/);
  assert.match(sql,/grant execute on function public\.import_csv_leads\(uuid, jsonb\) to authenticated/);
});

test("usuário anônimo é rejeitado",async()=>{
  const sql=await migration();
  assert.match(sql,/current_user_id is null[\s\S]*errcode = '42501'/);
  assert.match(sql,/revoke all on function public\.import_csv_leads\(uuid, jsonb\) from anon/);
});

test("campanha de outro usuário é rejeitada",async()=>{
  const sql=await migration();
  assert.match(sql,/where id = p_campaign_id\s+and user_id = current_user_id/);
  assert.match(sql,/raise exception 'Campaign not found'/);
});

test("user_id e campaign_id do JSON são ignorados",async()=>{
  const sql=await migration();
  assert.match(sql,/using new_id, current_user_id, p_campaign_id, item/);
  assert.doesNotMatch(sql,/item\s*->>\s*'(?:user_id|userId|campaign_id|campaignId)'/);
});

test("erro em uma linha provoca rollback total",async()=>{
  const sql=await migration();
  assert.match(sql,/^begin;/m);
  assert.match(sql,/raise exception 'Lead at position % has no name'/);
  assert.match(sql,/^commit;/m);
  assert.doesNotMatch(sql,/exception\s+when|continue;/i);
});

test("atividade lead_imported é criada para cada lead",async()=>{
  const sql=await migration();
  assert.match(sql,/insert into public\.crm_activities\(user_id, campaign_id, lead_id, type, note\)/);
  assert.match(sql,/'lead_imported'/);
});

test("função mantém RLS e usa privilégios mínimos",async()=>{
  const sql=await migration();
  assert.match(sql,/security invoker/);
  assert.match(sql,/set search_path = ''/);
  assert.doesNotMatch(sql,/disable row level security|using\s*\(\s*true\s*\)/i);
  assert.match(sql,/grant execute[\s\S]*to service_role/);
});

test("colunas opcionais só entram após consulta ao catálogo",async()=>{
  const sql=await migration();
  for(const column of ["rating","reviews","provider","instagram","facebook"]){
    assert.match(sql,new RegExp(`column_name = '${column}'`));
    assert.match(sql,new RegExp(`if has_${column} then`));
  }
});

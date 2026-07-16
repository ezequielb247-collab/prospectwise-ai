import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
const migration = readFileSync(
  "supabase/migrations/202607160002_fix_authenticated_grants.sql",
  "utf8",
);
const initial = readFileSync(
  "supabase/migrations/202607160001_sprint5_schema_rls.sql",
  "utf8",
);
const workspace = readFileSync("lib/workspace-data.ts", "utf8");
const profileRoute = readFileSync("app/api/profile/route.ts", "utf8");
const privateTables = [
  "profiles",
  "campaigns",
  "leads",
  "lead_analyses",
  "messages",
  "message_attempts",
  "conversations",
  "crm_activities",
  "opt_outs",
  "provider_settings",
  "app_settings",
];
test("authenticated e service role recebem privilégios básicos e RLS continua obrigatório", () => {
  assert.match(migration, /grant select, insert, update, delete on table/);
  assert.match(migration, /to authenticated, service_role/);
  assert.match(migration, /revoke all on table[\s\S]+from anon/);
  assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)/i);
  assert.match(migration, /not cls\.relrowsecurity/);
});
test("migration corretiva cobre todas as tabelas privadas", () => {
  for (const table of privateTables)
    assert.match(migration, new RegExp(`public\\.${table}(?:,|\\s)`));
});
test("trigger de profile é hardened, mantém o mesmo ID e propaga falhas", () => {
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /values\(new\.id/);
  assert.match(migration, /raise log/);
  assert.match(migration, /\n\s*raise;/);
});
test("sequences futuras recebem permissão somente quando pertencem às tabelas privadas", () => {
  assert.match(migration, /pg_depend/);
  assert.match(migration, /grant usage, select on sequence/);
  assert.match(migration, /revoke all on sequence/);
});
test("Dashboard registra tabela, operação, código e presença da sessão sem segredos", () => {
  for (const table of ["campaigns", "leads", "messages"])
    assert.match(workspace, new RegExp(`table:\"${table}\"`));
  assert.doesNotMatch(
    readFileSync("lib/safe-db-log.ts", "utf8"),
    /token|key|authorization/i,
  );
});
test("usuário autenticado pode consultar o próprio profile", () => {
  assert.match(profileRoute, /requireApiUser/);
  assert.match(profileRoute, /from\("profiles"\)/);
  assert.match(profileRoute, /eq\("id",\s*user\.id\)/);
});
test("RLS original permanece habilitado e vinculado a auth.uid", () => {
  assert.match(initial, /enable row level security/);
  assert.match(initial, /user_id = auth\.uid\(\)/);
  assert.match(initial, /id=auth\.uid\(\)/);
});
test("service role continua ausente do código cliente", () => {
  for (const path of [
    "app/Workspace.tsx",
    "lib/supabase/browser.ts",
    "proxy.ts",
  ])
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
});

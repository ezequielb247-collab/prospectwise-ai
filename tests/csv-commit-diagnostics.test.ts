import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const route = () =>
  readFile(
    new URL("../app/api/import/csv/commit/route.ts", import.meta.url),
    "utf8",
  );

test("commit preserva a chamada de importação existente", async () => {
  const source = await route();
  assert.match(
    source,
    /service\.import\(\s*user\.id,\s*input\.campaignId,\s*input\.text,\s*input\.mapping as never,?\s*\)/,
  );
});

test("commit mantém resposta de produção genérica", async () => {
  const source = await route();
  assert.match(source, /process\.env\.NODE_ENV === "production"/);
  assert.match(source, /\{ error: "Falha ao importar CSV\." \}/);
});

test("commit registra PostgrestError e Error sem conteúdo CSV", async () => {
  const source = await route();
  for (const field of [
    "endpoint",
    "campaignId",
    "userId",
    "rows",
    "code",
    "message",
    "details",
    "hint",
    "stack",
  ])
    assert.match(source, new RegExp(`\\b${field}\\b`));
  assert.match(source, /console\.error\("CSV commit failed"/);
  assert.doesNotMatch(
    source,
    /console\.(?:error|log)\([^\n]*(?:input\.text|CSV content|csvContent)/i,
  );
});

test("commit retorna diagnóstico completo somente em desenvolvimento", async () => {
  const source = await route();
  for (const field of ["name", "message", "code", "details", "hint", "stack"])
    assert.match(source, new RegExp(`${field}: info\\.${field}`));
});

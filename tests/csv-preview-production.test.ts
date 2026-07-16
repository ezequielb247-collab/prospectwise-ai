import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

const source=(path:string)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("preview envia campaignId e preserva o fluxo JSON atual",async()=>{
  const client=await source("app/leads/importar/page.tsx");
  assert.match(client,/JSON\.stringify\(\{ campaignId, text, mapping: nextMapping \}\)/);
});

test("preview aceita JSON e FormData sem Buffer ou PapaParse",async()=>{
  const route=await source("app/api/import/csv/preview/route.ts");
  assert.match(route,/request\.json\(\)/);
  assert.match(route,/request\.formData\(\)/);
  assert.match(route,/form\.get\("file"\)/);
  assert.match(route,/file\.arrayBuffer\(\)/);
  assert.match(route,/new TextDecoder\("utf-8"\)/);
  assert.doesNotMatch(route,/\bBuffer\b|PapaParse|papaparse/);
});

test("diagnóstico detalhado fica no servidor e só volta fora de produção",async()=>{
  const route=await source("app/api/import/csv/preview/route.ts");
  assert.match(route,/console\.error\("CSV preview failed"/);
  for(const field of ["endpoint","campaignId","fileSize","errorName","errorCode","errorMessage","stack"])assert.match(route,new RegExp(`\\b${field}\\b`));
  assert.match(route,/process\.env\.NODE_ENV !== "production"/);
  assert.match(route,/error: "Falha ao processar CSV\."/);
});

test("deduplicação consulta somente colunas realmente necessárias",async()=>{
  const repository=await source("lib/csv-import/supabase-repository.ts");
  assert.match(repository,/select\("name,phone,website,address,city,maps_url"\)/);
  assert.doesNotMatch(repository,/select\("[^"]*(instagram|facebook|rating|reviews)/);
});

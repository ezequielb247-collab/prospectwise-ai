import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const radar = readFileSync("app/radar/page.tsx", "utf8");
const bulk = readFileSync("app/BulkLeadActions.tsx", "utf8");
const listApi = readFileSync("app/api/prospect-lists/route.ts", "utf8");
const listPicker = readFileSync("app/ProspectListPicker.tsx", "utf8");
const messagesPage = readFileSync("app/mensagens/page.tsx", "utf8");
const messageCenter = readFileSync("app/MessageCenter.tsx", "utf8");
const importPage = readFileSync("app/leads/importar/page.tsx", "utf8");
const prospectingPage = readFileSync("app/prospeccao/page.tsx", "utf8");
const prospectingPanel = readFileSync("app/ManualProspectingPanel.tsx", "utf8");
const listDetail = readFileSync("app/listas/[id]/page.tsx", "utf8");

test("listas de prospecção não pedem UUID manual ao usuário", () => {
  assert.doesNotMatch(radar, /prompt\(["'`]ID da lista/);
  assert.doesNotMatch(bulk, /prompt\(["'`]ID da lista/);
  assert.match(radar, /ProspectListPicker/);
  assert.match(bulk, /ProspectListPicker/);
});

test("API de listas usa listId explícito e retorna erros amigáveis", () => {
  assert.match(listApi, /action: z\.literal\("add"\),\s*listId: uuid/);
  assert.match(listApi, /service\.add\(user\.id, input\.listId, input\.leadIds\)/);
  assert.match(listApi, /Lista inválida\./);
  assert.match(listApi, /Um ou mais leads são inválidos\./);
  assert.match(listPicker, /body: JSON\.stringify\(\{ action: "add", listId, leadIds \}\)/);
});

test("mensagens aceitam lote vindo do Radar e mantêm rascunhos persistidos", () => {
  assert.match(messagesPage, /leadIds\?: string/);
  assert.match(messagesPage, /split\(","\)/);
  assert.match(messageCenter, /Lote de prospecção/);
  assert.match(messageCenter, /Salvar \$\{checked\.length\}/);
  assert.match(messageCenter, /action: "bulk"/);
  assert.match(messageCenter, /persistedCurrent/);
  assert.match(messageCenter, /Próximo do lote/);
});

test("importador oferece modo gratuito de colar Google Maps", () => {
  assert.match(importPage, /"maps"/);
  assert.match(importPage, /Colar Google Maps/);
  assert.match(importPage, /googleMapsTextToCsv/);
  assert.match(importPage, /Identificar empresas e pré-visualizar/);
});

test("lista leva o lote para mensagens e prospecção manual", () => {
  assert.match(listDetail, /mensagens\?leadIds=/);
  assert.match(listDetail, /prospeccao\?listId=/);
  assert.match(prospectingPage, /searchParams/);
  assert.match(prospectingPage, /prospectLists\(\)/);
  assert.match(prospectingPanel, /initialLeadIds/);
  assert.match(prospectingPanel, /Mensagem .* carregada automaticamente/);
  assert.match(prospectingPanel, /messageId: latestMessage\?\.id/);
});

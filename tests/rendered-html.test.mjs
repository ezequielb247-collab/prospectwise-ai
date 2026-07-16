import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
const dynamicRoute=new URL("../app/leads/[id]/page.tsx",import.meta.url);
const messagesRoute=new URL("../app/mensagens/page.tsx",import.meta.url);
test("dynamic lead route resolves the URL ID without a first-lead fallback",async()=>{const source=await readFile(dynamicRoute,"utf8");assert.match(source,/findLeadById\(id\)/);assert.match(source,/Lead não encontrado/);assert.doesNotMatch(source,/leads\[0\]|firstLead|defaultLead/)});
test("messages route forwards the selected lead ID",async()=>{const source=await readFile(messagesRoute,"utf8");assert.match(source,/leadId/);assert.match(source,/initialLeadId/)});
test("search page calls the service API rather than a provider",async()=>{const source=await readFile(new URL("../app/leads/buscar/page.tsx",import.meta.url),"utf8");assert.match(source,/\/api\/search-companies/);assert.doesNotMatch(source,/new MockLeadProvider|new OutscraperLeadProvider/)});

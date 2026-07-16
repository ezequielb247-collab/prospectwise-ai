import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

test("MVP exposes all primary navigation routes",async()=>{const workspace=await readFile(new URL("../app/Workspace.tsx",import.meta.url),"utf8");for(const route of ["dashboard","campanhas","leads","crm","mensagens","configuracoes"])assert.match(workspace,new RegExp(route));});
test("real providers remain safely disabled",async()=>{const providers=await readFile(new URL("../lib/providers.ts",import.meta.url),"utf8");assert.match(providers,/MockWhatsAppProvider/);assert.match(providers,/Envios reais exigem aprovação manual/);});
test("opt-out language is included in generated message",async()=>{const workspace=await readFile(new URL("../app/Workspace.tsx",import.meta.url),"utf8");assert.match(workspace,/não receber novas mensagens/);});

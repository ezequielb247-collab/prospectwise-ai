import assert from "node:assert/strict";
import test from "node:test";

async function render(path){const workerUrl=new URL("../dist/server/index.js",import.meta.url);workerUrl.searchParams.set("test",`${process.pid}-${Date.now()}-${path}`);const {default:worker}=await import(workerUrl.href);return worker.fetch(new Request(`http://localhost${path}`,{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})},DB:{}},{waitUntil(){},passThroughOnException(){}})}

test("three lead URLs render their matching companies",async()=>{for(const [id,name] of [["lead-sorriso-prime","Sorriso Prime Odontologia"],["lead-studio-helena","Studio Helena Arquitetura"],["lead-cafe-aurora","Café Aurora"]]){const response=await render(`/leads/${id}`);assert.equal(response.status,200);assert.match(await response.text(),new RegExp(name));}});
test("unknown lead ID renders not found state",async()=>{const response=await render("/leads/id-inexistente");assert.equal(response.status,200);assert.match(await response.text(),/Lead não encontrado/);});
test("three message URLs render the selected company",async()=>{for(const [id,name] of [["lead-sorriso-prime","Sorriso Prime Odontologia"],["lead-studio-helena","Studio Helena Arquitetura"],["lead-cafe-aurora","Café Aurora"]]){const response=await render(`/mensagens?leadId=${id}`);assert.equal(response.status,200);assert.match(await response.text(),new RegExp(name));}});

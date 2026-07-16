import assert from "node:assert/strict";
import test from "node:test";
import {buildLeadMessage,findLeadById,MOCK_LEADS} from "../lib/mock-leads";
import {createInitialCrmState,moveLead,parseCrmState,serializeCrmState} from "../lib/mock-crm";

test("mock IDs are unique and stable",()=>{assert.equal(new Set(MOCK_LEADS.map(lead=>lead.id)).size,MOCK_LEADS.length);assert.equal(findLeadById("lead-studio-helena")?.name,"Studio Helena Arquitetura");assert.equal(findLeadById("missing"),undefined)});
test("messages use each selected lead's own data",()=>{for(const id of ["lead-sorriso-prime","lead-studio-helena","lead-cafe-aurora"]){const lead=findLeadById(id);assert.ok(lead);const message=buildLeadMessage(lead);assert.match(message,new RegExp(lead.name));assert.match(message,new RegExp(lead.category,"i"));assert.match(message,new RegExp(lead.city));}});
test("CRM moves a lead through stages without mutating prior state",()=>{const initial=createInitialCrmState();const contacted=moveLead(initial,"lead-almeida-reis","Contatado");const replied=moveLead(contacted,"lead-almeida-reis","Respondeu");assert.equal(initial["lead-almeida-reis"],"Novo");assert.equal(contacted["lead-almeida-reis"],"Contatado");assert.equal(replied["lead-almeida-reis"],"Respondeu")});
test("serialized mock persistence survives reload",()=>{const moved=moveLead(createInitialCrmState(),"lead-almeida-reis","Respondeu");const reloaded=parseCrmState(serializeCrmState(moved));assert.equal(reloaded["lead-almeida-reis"],"Respondeu")});

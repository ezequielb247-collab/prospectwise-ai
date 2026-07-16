import assert from "node:assert/strict";
import test from "node:test";
import {MockLeadProvider,OutscraperLeadProvider} from "../lib/providers";
import {InMemoryLeadRepository,SearchCompaniesService} from "../lib/search-companies-service";

test("MockLeadProvider respects the requested quantity and stable IDs",async()=>{const provider=new MockLeadProvider();const input={city:"Campinas",state:"SP",category:"Dentista",limit:7};const first=await provider.search(input);const second=await provider.search(input);assert.equal(first.length,7);assert.deepEqual(first.map(item=>item.externalId),second.map(item=>item.externalId))});

test("OutscraperLeadProvider maps API fields without making a paid call",async()=>{const fakeFetch:typeof fetch=async()=>new Response(JSON.stringify({data:[[{place_id:"place-1",name:"Clínica Teste",phone:"+551199999999",site:"https://teste.example",full_address:"Campinas, SP",type:"Dentista",rating:4.8,reviews:42,google_maps_url:"https://maps.example/1"}]]}),{status:200,headers:{"Content-Type":"application/json"}});const provider=new OutscraperLeadProvider("test-key",fakeFetch);const results=await provider.search({city:"Campinas",state:"SP",category:"Dentista",limit:1});assert.equal(results.length,1);assert.equal(results[0].externalId,"place-1");assert.equal(results[0].name,"Clínica Teste");assert.equal(results[0].website,"https://teste.example")});

test("SearchCompaniesService imports once and reports duplicates",async()=>{const repository=new InMemoryLeadRepository();const service=new SearchCompaniesService(new MockLeadProvider(),repository);const input={city:"Campinas",state:"SP",category:"Dentista",limit:3};const first=await service.execute("user-1",input);const second=await service.execute("user-1",input);assert.equal(first.stats.imported,3);assert.equal(first.stats.duplicates,0);assert.equal(second.stats.imported,0);assert.equal(second.stats.duplicates,3)});

test("Outscraper provider requires a server-side key",()=>{assert.throws(()=>new OutscraperLeadProvider(""),/OUTSCRAPER_API_KEY/)});

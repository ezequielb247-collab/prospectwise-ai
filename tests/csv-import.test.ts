import assert from "node:assert/strict";
import test from "node:test";
import {MemoryCsvLeadRepository} from "../lib/csv-import/memory-repository";
import {MAX_CSV_BYTES,neutralizeFormula,normalizePhone} from "../lib/csv-import/parser";
import {CsvImportService} from "../lib/csv-import/service";

function setup(){const repository=new MemoryCsvLeadRepository();repository.allowCampaign("user-a","campaign-a");repository.allowCampaign("user-a","campaign-b");repository.allowCampaign("user-b","campaign-a");return {repository,service:new CsvImportService(repository)}}
const valid="nome,telefone,site,cidade\nClínica Aurora,(19) 99999-1111,clinicaaurora.com.br,Campinas";

test("CSV válido é importado e persiste no repositório",async()=>{const {repository,service}=setup();const result=await service.import("user-a","campaign-a",valid);assert.equal(result.imported,1);assert.equal(repository.records[0].lead.name,"Clínica Aurora")});
test("colunas fora de ordem e aliases em inglês funcionam",async()=>{const {service}=setup();const preview=await service.preview("user-a","city,phone,company\nSantos,13999998888,Mar Azul");assert.equal(preview.rows[0].lead.name,"Mar Azul");assert.equal(preview.rows[0].lead.city,"Santos")});
test("telefone é normalizado para E.164 brasileiro",()=>{assert.equal(normalizePhone("(19) 99999-1111"),"+5519999991111")});
test("duplicadas por telefone são ignoradas",async()=>{const {repository,service}=setup();await service.import("user-a","campaign-a",valid);const result=await service.import("user-a","campaign-a","nome,telefone,cidade\nOutro nome,19999991111,Santos");assert.equal(result.imported,0);assert.equal(result.duplicates,1);assert.equal(repository.records.length,1)});
test("linha sem nome é rejeitada",async()=>{const {service}=setup();const preview=await service.preview("user-a","nome,telefone\n,11999999999");assert.equal(preview.stats.invalid,1);assert.match(preview.rows[0].errors.join(" "),/Nome ausente/)});
test("lead pertence à campanha selecionada",async()=>{const {repository,service}=setup();await service.import("user-a","campaign-b",valid);assert.equal(repository.records[0].campaignId,"campaign-b")});
test("usuários não compartilham dados nem deduplicação",async()=>{const {repository,service}=setup();await service.import("user-a","campaign-a",valid);const result=await service.import("user-b","campaign-a",valid);assert.equal(result.imported,1);assert.deepEqual(repository.records.map(row=>row.userId),["user-a","user-b"])});
test("arquivo acima do limite é rejeitado",async()=>{const {service}=setup();await assert.rejects(()=>service.preview("user-a",`nome\n${"a".repeat(MAX_CSV_BYTES)}`),/maior que 2 MB/)});
test("fórmulas CSV são neutralizadas como texto",()=>{assert.equal(neutralizeFormula("=HYPERLINK(\"x\")"),"'=HYPERLINK(\"x\")")});
test("importação permanece após uma nova sessão de serviço",async()=>{const {repository,service}=setup();await service.import("user-a","campaign-a",valid);const afterLogin=new CsvImportService(repository);const preview=await afterLogin.preview("user-a",valid);assert.equal(preview.stats.duplicates,1);assert.equal(repository.records.length,1)});

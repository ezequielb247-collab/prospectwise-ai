import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { analyzeImportedLeads } from "../lib/intelligence/client-batch";
import { LeadIntelligenceService } from "../lib/intelligence/lead-intelligence-service";
import { LeadScoringEngine } from "../lib/intelligence/lead-scoring-engine";
import { queryRadar } from "../lib/intelligence/radar";
import {
  InMemoryIntelligenceActivityRepository,
  InMemoryLeadAnalysisRepository,
  type LeadIntelligenceDataSource,
} from "../lib/intelligence/repositories";
import type { LeadIntelligenceInput } from "../lib/intelligence/types";

class Source implements LeadIntelligenceDataSource {
  constructor(readonly leads: LeadIntelligenceInput[]) {}
  async findLeadById(id: string) {
    return this.leads.find((lead) => lead.id === id);
  }
  async findLeadsByCampaignId(
    campaignId: string,
    options: { offset?: number; limit?: number } = {},
  ) {
    const leads = this.leads.filter((lead) => lead.campaignId === campaignId);
    const offset = options.offset ?? 0;
    return leads.slice(offset, options.limit ? offset + options.limit : undefined);
  }
  async countLeadsByCampaignId(campaignId: string) {
    return this.leads.filter((lead) => lead.campaignId === campaignId).length;
  }
  async listLeads() {
    return this.leads;
  }
}

const lead = (id: string, campaignId = "campaign-a"): LeadIntelligenceInput => ({
  id,
  campaignId,
  name: `Empresa ${id}`,
  category: "Serviços",
  city: "Macaé",
  website: null,
  phone: "5522999999999",
  address: "Rua A",
  rating: 4.8,
  reviews: 80,
});

function setup(leads: LeadIntelligenceInput[]) {
  const source = new Source(leads);
  const analyses = new InMemoryLeadAnalysisRepository();
  const activities = new InMemoryIntelligenceActivityRepository();
  return {
    source,
    analyses,
    activities,
    service: new LeadIntelligenceService(
      source,
      new LeadScoringEngine(),
      analyses,
      activities,
    ),
  };
}

test("importação dispara análise automática em lotes e mostra progresso", async () => {
  const originalFetch = globalThis.fetch;
  const batches: string[][] = [];
  globalThis.fetch = (async (input, init) => {
    void input;
    const body = JSON.parse(String(init?.body)) as { leadIds: string[] };
    batches.push(body.leadIds);
    return Response.json({ processed: body.leadIds.length, total: body.leadIds.length, done: true });
  }) as typeof fetch;
  try {
    const ids = Array.from({ length: 121 }, () => crypto.randomUUID());
    const progress: number[] = [];
    await analyzeImportedLeads("campaign-a", ids, (item) => progress.push(item.percentage));
    assert.deepEqual(batches.map((batch) => batch.length), [50, 50, 21]);
    assert.equal(progress.at(-1), 100);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("análise automática atualiza score, prioridade e classificação", async () => {
  const { service } = setup([lead("lead-a")]);
  const [analysis] = await service.analyzeLeadIds("campaign-a", ["lead-a"]);
  assert.ok(analysis.score > 0);
  assert.ok(analysis.priority);
  assert.ok(analysis.classification);
});

test("Radar recebe imediatamente o lead analisado", async () => {
  const item = lead("lead-a");
  const { service } = setup([item]);
  const [analysis] = await service.analyzeLeadIds("campaign-a", [item.id]);
  assert.deepEqual(queryRadar([{ lead: item, analysis }]).map((entry) => entry.lead.id), [item.id]);
});

test("lote rejeita lead de outra campanha", async () => {
  const { service } = setup([lead("lead-b", "campaign-b")]);
  await assert.rejects(
    service.analyzeLeadIds("campaign-a", ["lead-b"]),
    /não encontrado na campanha/i,
  );
});

test("reanálise recalcula registros sem duplicá-los", async () => {
  const { service, analyses } = setup([lead("lead-a"), lead("lead-b")]);
  await service.analyzeCampaignBatch("campaign-a", { limit: 1 });
  await service.analyzeCampaignBatch("campaign-a", { offset: 1, limit: 1 });
  await service.analyzeCampaignBatch("campaign-a", { limit: 2, recalculate: true });
  assert.equal((await analyses.list()).length, 2);
});

test("CRM e Dashboard leem a classificação persistida", () => {
  const workspace = fs.readFileSync("lib/workspace-data.ts", "utf8");
  const crm = fs.readFileSync("app/Workspace.tsx", "utf8");
  assert.match(workspace, /classification,priority,recommended_services,reasons/);
  assert.match(workspace, /classification: analyses\.get\(lead\.id\)/);
  assert.match(crm, /lead\.classification/);
});

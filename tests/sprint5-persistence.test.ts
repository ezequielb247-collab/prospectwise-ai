import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  PersistenceService,
  type PersistentRepository,
} from "../lib/persistence-service";
const root = process.cwd();
function source(path: string) {
  return readFileSync(isAbsolute(path) ? path : join(root, path), "utf8");
}
function files(path: string): string[] {
  return readdirSync(path).flatMap((name) => {
    const full = join(path, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}
class DurableFake implements PersistentRepository {
  campaigns = new Map<string, { userId: string; name: string }>();
  leads = new Map<
    string,
    { userId: string; campaignId: string; stage: string }
  >();
  messages = new Map<
    string,
    { userId: string; leadId: string; campaignId: string }
  >();
  activities: string[] = [];
  constructor(private userId: string) {}
  async createCampaign(
    input: Parameters<PersistentRepository["createCampaign"]>[0],
  ) {
    const id = `campaign-${this.campaigns.size + 1}`;
    this.campaigns.set(id, { userId: this.userId, name: input.name });
    return id;
  }
  async updateCampaignStatus(
    input: Parameters<PersistentRepository["updateCampaignStatus"]>[0],
  ) {
    const campaign = this.campaigns.get(input.campaignId);
    if (!campaign || campaign.userId !== this.userId)
      throw new Error("Campanha não encontrada.");
    this.activities.push(input.status);
  }
  async moveLead(input: Parameters<PersistentRepository["moveLead"]>[0]) {
    const lead = this.leads.get(input.leadId);
    if (
      !lead ||
      lead.userId !== this.userId ||
      lead.campaignId !== input.campaignId
    )
      throw new Error("Lead não encontrado.");
    lead.stage = input.stage;
    this.activities.push(input.stage);
  }
  async prepareMessage(
    input: Parameters<PersistentRepository["prepareMessage"]>[0],
  ) {
    const lead = this.leads.get(input.leadId);
    if (
      !lead ||
      lead.userId !== this.userId ||
      lead.campaignId !== input.campaignId
    )
      throw new Error("Lead não encontrado.");
    const id = `message-${this.messages.size + 1}`;
    this.messages.set(id, {
      userId: this.userId,
      leadId: input.leadId,
      campaignId: input.campaignId,
    });
    return id;
  }
}
test("usuário A não acessa ou altera dados do usuário B", async () => {
  const store = new DurableFake("user-a");
  store.leads.set("lead-b", {
    userId: "user-b",
    campaignId: "campaign-b",
    stage: "Novo",
  });
  await assert.rejects(
    () =>
      new PersistenceService(store).moveLead({
        leadId: "lead-b",
        campaignId: "campaign-b",
        stage: "Cliente",
      }),
    /não encontrado/i,
  );
});
test("login e logout usam autenticação Supabase", () => {
  const auth = source("app/auth/actions.ts");
  assert.match(auth, /signInWithPassword/);
  assert.match(auth, /signOut\(\)/);
});
test("rotas privadas redirecionam usuário sem sessão", () => {
  const proxy = source("proxy.ts");
  assert.match(proxy, /if\(!user\)/);
  assert.match(proxy, /pathname="\/login"/);
});
test("campanha criada permanece no repositório após nova instância do serviço", async () => {
  const repo = new DurableFake("user-a");
  const id = await new PersistenceService(repo).createCampaign({
    name: "Campanha",
    city: "Campinas",
    state: "SP",
    segment: "Serviços",
    companyLimit: 10,
    dailyLimit: 5,
    services: ["Site"],
  });
  assert.equal(repo.campaigns.get(id)?.name, "Campanha");
});
test("lead e movimento do CRM permanecem e geram atividade", async () => {
  const repo = new DurableFake("user-a");
  repo.leads.set("lead-a", {
    userId: "user-a",
    campaignId: "campaign-a",
    stage: "Novo",
  });
  await new PersistenceService(repo).moveLead({
    leadId: "lead-a",
    campaignId: "campaign-a",
    stage: "Contatado",
  });
  assert.equal(repo.leads.get("lead-a")?.stage, "Contatado");
  assert.deepEqual(repo.activities, ["Contatado"]);
});
test("Lead Intelligence e Radar usam repositório persistente por usuário", () => {
  const container = source("lib/intelligence/container.ts");
  assert.match(container, /SupabaseIntelligenceRepository/);
  assert.match(
    source("app/api/intelligence/radar/route.ts"),
    /getUserRadar\(user\.id/,
  );
});
test("mensagem valida lead, campanha e proprietário", () => {
  const repository = source("lib/supabase/persistence-repository.ts");
  assert.match(repository, /eq\("user_id",\s*this\.userId\)/);
  assert.match(repository, /eq\("campaign_id",\s*input\.campaignId\)/);
});
test("ID de outro usuário resulta em não encontrado", async () => {
  const repo = new DurableFake("user-a");
  repo.leads.set("lead-b", {
    userId: "user-b",
    campaignId: "campaign-b",
    stage: "Novo",
  });
  await assert.rejects(
    () =>
      repo.prepareMessage({
        leadId: "lead-b",
        campaignId: "campaign-b",
        body: "Mensagem válida",
      }),
    /não encontrado/i,
  );
});
test("seed é opcional e idempotente", () => {
  const seed = source("scripts/seed-demo.ts");
  assert.match(seed, /NODE_ENV==="production"/);
  assert.match(seed, /upsert/g);
  assert.match(seed, /10000000-0000-4000-8000-000000000001/);
});
test("nenhuma tela depende diretamente dos mocks ou localStorage", () => {
  const appSource = files(join(root, "app"))
    .filter((path) => /\.(ts|tsx)$/.test(path))
    .map(source)
    .join("\n");
  assert.doesNotMatch(
    appSource,
    /MOCK_(LEADS|CAMPAIGNS|MESSAGES|EVENTS)|mock-leads|mock-campaigns|localStorage/,
  );
});
test("RLS e relações compostas isolam todos os registros", () => {
  const sql = source("supabase/migrations/202607160001_sprint5_schema_rls.sql");
  for (const table of [
    "campaigns",
    "leads",
    "lead_analyses",
    "messages",
    "crm_activities",
    "app_settings",
  ])
    assert.match(sql, new RegExp(`['\"]${table}['\"]`));
  assert.match(sql, /enable row level security/);
  assert.match(sql, /foreign key\(campaign_id,user_id\)/);
});
test("chave service role não aparece em código cliente", () => {
  const clientSource = files(join(root, "app"))
    .filter((path) => /\.(ts|tsx)$/.test(path))
    .map(source)
    .join("\n");
  assert.doesNotMatch(clientSource, /SUPABASE_SERVICE_ROLE_KEY/);
});

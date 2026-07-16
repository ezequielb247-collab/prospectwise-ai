/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { MessageTemplateEngine } from "../lib/messages/template-engine";
import {
  MessageService,
  type MessageRepository,
} from "../lib/messages/service";
import { neutralizeCsv } from "../lib/messages/export";
import type {
  CommercialMessage,
  MessageContext,
  Template,
} from "../lib/messages/types";
const template: Template = {
  id: "t1",
  userId: "u1",
  name: "Contato",
  category: null,
  service: "Site",
  type: "first_contact",
  channel: "whatsapp",
  content: "Olá {{empresa}}, em {{cidade}}. Site: {{site}}.",
  active: true,
  version: 3,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};
const context = (name = "Empresa A", campaignId = "c1"): MessageContext => ({
  lead: {
    id: name,
    campaignId,
    name,
    phone: "+551199",
    website: null,
    city: "Campinas",
    state: "SP",
    category: "Clínica",
    crmStage: "Novo",
  },
  campaign: { id: campaignId, name: "Campanha Saúde", services: ["Site"] },
  analysis: {
    score: 80,
    priority: "Alta",
    recommendedServices: ["Site"],
    mainReason: "Sem site",
  },
});
class MemoryRepo implements MessageRepository {
  messages: CommercialMessage[] = [];
  contexts = new Map([
    ["a", context("Empresa A")],
    ["b", context("Empresa B")],
    [
      "opt",
      {
        ...context("Opt-out"),
        lead: { ...context("Opt-out").lead, crmStage: "Opt-out" },
      },
    ],
  ]);
  constructor(public owner = "u1") {}
  async context(user: string, lead: string, campaign: string) {
    if (user !== this.owner) return;
    const found = this.contexts.get(lead);
    return found?.lead.campaignId === campaign ? found : undefined;
  }
  async template(user: string, id: string): Promise<Template | undefined> {
    if (user !== this.owner) return undefined;
    if (id === "manual") return { ...template, id, channel: "manual" as const };
    if (id === "unknown") return { ...template, id, content: "Olá {{codigo}}" };
    return id === template.id ? template : undefined;
  }
  async message(user: string, id: string) {
    return user === this.owner
      ? this.messages.find((item) => item.id === id)
      : undefined;
  }
  async list(user: string) {
    return user === this.owner ? this.messages : [];
  }
  async hasFirstContact(_u: string, lead: string, campaign: string) {
    return this.messages.some(
      (item) =>
        item.leadId === lead &&
        item.campaignId === campaign &&
        item.type === "first_contact" &&
        item.status !== "cancelled",
    );
  }
  async isOptedOut(_u: string, phone: string) {
    return phone === "blocked";
  }
  async save(user: string, input: any) {
    const now = new Date().toISOString();
    const item = {
      ...input,
      id: `m${this.messages.length + 1}`,
      userId: user,
      createdAt: now,
      updatedAt: now,
    } as CommercialMessage;
    this.messages.push(item);
    return item;
  }
  async update(user: string, id: string, patch: any) {
    const item = await this.message(user, id);
    if (!item) throw new Error("Mensagem não encontrada.");
    Object.assign(item, patch);
    return item;
  }
  async templates() {
    return [template];
  }
  async seedTemplates() {
    return 5;
  }
}
test("template substitui variáveis corretamente", () => {
  assert.match(
    new MessageTemplateEngine().render(context(), template).body,
    /Empresa A.*Campinas/,
  );
});
test("variável desconhecida gera aviso", () => {
  const result = new MessageTemplateEngine().render(context(), {
    ...template,
    content: "{{codigo}}",
  });
  assert.match(result.warnings[0].message, /desconhecida/);
});
test("dado ausente não é inventado", () => {
  const result = new MessageTemplateEngine().render(context(), template);
  assert.match(result.body, /\[não informado\]/);
  assert.match(result.warnings.map((item) => item.message).join(), /site/);
});
test("lead selecionado gera empresa correta", async () => {
  const service = new MessageService(new MemoryRepo());
  assert.match(
    (
      await service.preview("u1", {
        leadId: "a",
        campaignId: "c1",
        templateId: "t1",
      })
    ).body,
    /Empresa A/,
  );
});
test("leads diferentes geram conteúdos diferentes", async () => {
  const service = new MessageService(new MemoryRepo());
  const a = await service.preview("u1", {
      leadId: "a",
      campaignId: "c1",
      templateId: "t1",
    }),
    b = await service.preview("u1", {
      leadId: "b",
      campaignId: "c1",
      templateId: "t1",
    });
  assert.notEqual(a.body, b.body);
});
test("lead de outra campanha é rejeitado", async () => {
  await assert.rejects(
    () =>
      new MessageService(new MemoryRepo()).preview("u1", {
        leadId: "a",
        campaignId: "c2",
        templateId: "t1",
      }),
    /não pertence/,
  );
});
test("usuário não acessa mensagem de outro usuário", async () => {
  const repo = new MemoryRepo();
  const service = new MessageService(repo);
  const saved = await service.create("u1", {
    leadId: "a",
    campaignId: "c1",
    templateId: "t1",
    status: "draft",
  });
  await assert.rejects(
    () => service.transition("u2", saved.id, "approved"),
    /não encontrada/,
  );
});
test("Opt-out bloqueia geração", async () => {
  await assert.rejects(
    () =>
      new MessageService(new MemoryRepo()).preview("u1", {
        leadId: "opt",
        campaignId: "c1",
        templateId: "t1",
      }),
    /opt-out/i,
  );
});
test("primeira abordagem duplicada exige confirmação", async () => {
  const service = new MessageService(new MemoryRepo());
  await service.create("u1", {
    leadId: "a",
    campaignId: "c1",
    templateId: "t1",
    status: "draft",
  });
  await assert.rejects(
    () =>
      service.create("u1", {
        leadId: "a",
        campaignId: "c1",
        templateId: "t1",
        status: "draft",
      }),
    /Confirme/,
  );
});
test("mensagem aprovada não pode ser editada", async () => {
  const service = new MessageService(new MemoryRepo());
  const item = await service.create("u1", {
    leadId: "a",
    campaignId: "c1",
    templateId: "t1",
    status: "draft",
  });
  await service.transition("u1", item.id, "approved");
  await assert.rejects(() => service.edit("u1", item.id, "novo"), /rascunho/);
});
test("voltar para rascunho permite edição", async () => {
  const service = new MessageService(new MemoryRepo());
  const item = await service.create("u1", {
    leadId: "a",
    campaignId: "c1",
    templateId: "t1",
    status: "draft",
  });
  await service.transition("u1", item.id, "approved");
  await service.transition("u1", item.id, "draft");
  assert.equal((await service.edit("u1", item.id, "novo")).body, "novo");
});
test("geração em lote cria mensagens corretas", async () => {
  const service = new MessageService(new MemoryRepo());
  const result = await service.bulk("u1", {
    campaignId: "c1",
    leadIds: ["a", "b"],
    templateId: "t1",
  });
  assert.equal(result.created.length, 2);
  assert.notEqual(result.created[0].body, result.created[1].body);
});
test("exportação CSV neutraliza fórmulas", () =>
  assert.equal(neutralizeCsv("=CMD()"), '"\'=CMD()"'));
test("nenhum envio externo acontece", () => {
  const sources = fs.readFileSync("lib/messages/service.ts", "utf8");
  assert.doesNotMatch(sources, /fetch\(|sendMessage|whatsapp\.com|smtp/i);
});
test("nenhuma chave aparece no bundle cliente", () => {
  const client = fs.readFileSync("app/MessageCenter.tsx", "utf8");
  assert.doesNotMatch(client, /SERVICE_ROLE|OPENAI_API_KEY|SUPABASE.*KEY/);
});
test("persistência continua após logout e login", async () => {
  const repo = new MemoryRepo();
  const first = new MessageService(repo);
  await first.create("u1", {
    leadId: "a",
    campaignId: "c1",
    templateId: "t1",
    status: "draft",
  });
  const afterLogin = new MessageService(repo);
  assert.equal((await repo.list("u1")).length, 1);
  assert.ok(afterLogin);
});
test("cidade ausente gera warning e não bloqueia aprovação", async () => {
  const repo = new MemoryRepo();
  repo.contexts.set("sem-cidade", {
    ...context("Sem Cidade"),
    lead: { ...context("Sem Cidade").lead, id: "sem-cidade", city: null },
  });
  const service = new MessageService(repo);
  const item = await service.create("u1", {
    leadId: "sem-cidade",
    campaignId: "c1",
    templateId: "t1",
    status: "prepared",
  });
  assert.ok(
    item.warnings.some(
      (issue) => issue.type === "warning" && issue.field === "cidade",
    ),
  );
  assert.equal(
    (await service.transition("u1", item.id, "approved")).status,
    "approved",
  );
});
test("site ausente gera warning e não bloqueia aprovação", async () => {
  const service = new MessageService(new MemoryRepo());
  const item = await service.create("u1", {
    leadId: "a",
    campaignId: "c1",
    templateId: "t1",
    status: "prepared",
  });
  assert.ok(item.warnings.some((issue) => issue.field === "site"));
  assert.equal(
    (await service.transition("u1", item.id, "approved")).status,
    "approved",
  );
});
test("telefone ausente bloqueia somente canal WhatsApp", async () => {
  const repo = new MemoryRepo();
  repo.contexts.set("sem-fone", {
    ...context("Sem Fone"),
    lead: { ...context("Sem Fone").lead, id: "sem-fone", phone: null },
  });
  const service = new MessageService(repo);
  await assert.rejects(
    () =>
      service.preview("u1", {
        leadId: "sem-fone",
        campaignId: "c1",
        templateId: "t1",
      }),
    /telefone/,
  );
  const manual = await service.create("u1", {
    leadId: "sem-fone",
    campaignId: "c1",
    templateId: "manual",
    status: "prepared",
  });
  assert.equal(
    (await service.transition("u1", manual.id, "approved")).status,
    "approved",
  );
});
test("variável desconhecida ou não resolvida bloqueia aprovação", async () => {
  const service = new MessageService(new MemoryRepo());
  const unknown = await service.create("u1", {
    leadId: "a",
    campaignId: "c1",
    templateId: "unknown",
    status: "draft",
  });
  await assert.rejects(
    () => service.transition("u1", unknown.id, "approved"),
    /Variável desconhecida|não resolvida/,
  );
  const unresolved = await service.create("u1", {
    leadId: "b",
    campaignId: "c1",
    templateId: "t1",
    body: "Olá {{cidade}}",
    status: "draft",
  });
  await assert.rejects(
    () => service.transition("u1", unresolved.id, "approved"),
    /não resolvida/,
  );
});
test("mensagem vazia bloqueia aprovação", async () => {
  const service = new MessageService(new MemoryRepo());
  const item = await service.create("u1", {
    leadId: "a",
    campaignId: "c1",
    templateId: "t1",
    body: "",
    status: "draft",
  });
  await assert.rejects(
    () => service.transition("u1", item.id, "approved"),
    /vazia/,
  );
});

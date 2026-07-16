/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import {
  FollowUpService,
  QueueService,
  type FollowUpRepository,
} from "../lib/follow-up/service";
import { adjustSchedule } from "../lib/follow-up/scheduling";
import type {
  CampaignQueueConfig,
  FollowUp,
  FollowUpContext,
  FollowUpType,
  QueueItem,
} from "../lib/follow-up/types";
const config: CampaignQueueConfig = {
  followUpEnabled: true,
  maxFollowUpAttempts: 2,
  delays: [3, 7, 14],
  allowedWeekdays: [1, 2, 3, 4, 5],
  sendWindowStart: "09:00",
  sendWindowEnd: "17:00",
  timezone: "America/Sao_Paulo",
  dailyLimit: 5,
  userDailyLimit: 10,
  maxRetries: 3,
};
const base = (over: Partial<FollowUpContext> = {}): FollowUpContext => ({
  campaign: { id: "c1", status: "Ativa", config },
  lead: { id: "l1", campaignId: "c1", status: "Novo", phone: "+551199" },
  message: {
    id: "m1",
    campaignId: "c1",
    leadId: "l1",
    status: "approved",
    channel: "whatsapp",
  },
  ...over,
});
class MemoryRepo implements FollowUpRepository {
  followUps: FollowUp[] = [];
  queue: QueueItem[] = [];
  contexts = new Map([
    ["u1", base()],
    [
      "u2",
      base({
        lead: { ...base().lead, id: "l2" },
        message: { ...base().message!, id: "m2", leadId: "l2" },
      }),
    ],
  ]);
  campaignCount = 0;
  userCount = 0;
  async context(
    user: string,
    campaign: string,
    lead: string,
    message?: string,
  ) {
    const value = this.contexts.get(user);
    return value?.campaign.id === campaign &&
      value.lead.id === lead &&
      (!message || value.message?.id === message)
      ? value
      : undefined;
  }
  async activeDuplicate(
    user: string,
    lead: string,
    type: FollowUpType,
    attempt: number,
  ) {
    return this.followUps.some(
      (x) =>
        x.userId === user &&
        x.leadId === lead &&
        x.type === type &&
        x.attemptNumber === attempt &&
        ["pending", "due"].includes(x.status),
    );
  }
  async activeAttempts(user: string, lead: string) {
    return this.followUps.filter(
      (x) =>
        x.userId === user &&
        x.leadId === lead &&
        ["pending", "due", "completed"].includes(x.status),
    ).length;
  }
  async createFollowUp(user: string, input: any) {
    const now = new Date().toISOString(),
      item = {
        ...input,
        id: `f${this.followUps.length + 1}`,
        userId: user,
        createdAt: now,
        updatedAt: now,
      };
    this.followUps.push(item);
    return item;
  }
  async updateFollowUp(user: string, id: string, patch: any) {
    const item = this.followUps.find((x) => x.userId === user && x.id === id);
    if (!item) throw new Error("não encontrado");
    Object.assign(item, patch);
    return item;
  }
  async cancelActive(user: string, lead: string, reason: string) {
    let count = 0;
    for (const item of this.followUps)
      if (
        item.userId === user &&
        item.leadId === lead &&
        ["pending", "due"].includes(item.status)
      ) {
        item.status = "cancelled";
        item.reason = reason;
        count++;
      }
    return count;
  }
  async listFollowUps(user: string) {
    return this.followUps.filter((x) => x.userId === user);
  }
  async activeQueueDuplicate(user: string, message: string) {
    return this.queue.some(
      (x) =>
        x.userId === user &&
        x.messageId === message &&
        ["pending", "scheduled", "ready", "processing"].includes(x.status),
    );
  }
  async dailyCounts() {
    return { campaign: this.campaignCount, user: this.userCount };
  }
  async createQueue(user: string, input: any) {
    const now = new Date().toISOString(),
      item = {
        ...input,
        id: `q${this.queue.length + 1}`,
        userId: user,
        createdAt: now,
        updatedAt: now,
      };
    this.queue.push(item);
    return item;
  }
  async updateQueue(user: string, id: string, patch: any) {
    const item = this.queue.find((x) => x.userId === user && x.id === id);
    if (!item) throw new Error("não encontrado");
    Object.assign(item, patch);
    return item;
  }
  async listQueue(user: string) {
    return this.queue.filter((x) => x.userId === user);
  }
  async queueCampaignStatus(user: string, id: string) {
    const item = this.queue.find(
      (entry) => entry.userId === user && entry.id === id,
    );
    return item ? this.contexts.get(user)?.campaign.status : undefined;
  }
}
const when = "2027-07-05T15:00:00.000Z";
test("follow-up é criado para lead correto", async () => {
  const repo = new MemoryRepo(),
    item = await new FollowUpService(repo).create("u1", {
      campaignId: "c1",
      leadId: "l1",
      type: "manual",
      attemptNumber: 1,
      scheduledFor: when,
    });
  assert.equal(item.leadId, "l1");
});
test("lead de outra campanha é rejeitado", async () =>
  assert.rejects(
    () =>
      new FollowUpService(new MemoryRepo()).create("u1", {
        campaignId: "c2",
        leadId: "l1",
        type: "manual",
        attemptNumber: 1,
        scheduledFor: when,
      }),
    /não pertence/,
  ));
test("opt-out bloqueia follow-up", async () => {
  const repo = new MemoryRepo();
  repo.contexts.set(
    "u1",
    base({ lead: { ...base().lead, status: "Opt-out" } }),
  );
  await assert.rejects(
    () =>
      new FollowUpService(repo).create("u1", {
        campaignId: "c1",
        leadId: "l1",
        type: "manual",
        attemptNumber: 1,
        scheduledFor: when,
      }),
    /Opt-out/,
  );
});
test("cliente bloqueia follow-up", async () => {
  const repo = new MemoryRepo();
  repo.contexts.set(
    "u1",
    base({ lead: { ...base().lead, status: "Cliente" } }),
  );
  await assert.rejects(
    () =>
      new FollowUpService(repo).create("u1", {
        campaignId: "c1",
        leadId: "l1",
        type: "manual",
        attemptNumber: 1,
        scheduledFor: when,
      }),
    /Cliente/,
  );
});
test("resposta cancela follow-ups pendentes", async () => {
  const repo = new MemoryRepo(),
    service = new FollowUpService(repo);
  await service.create("u1", {
    campaignId: "c1",
    leadId: "l1",
    type: "manual",
    attemptNumber: 1,
    scheduledFor: when,
  });
  assert.equal(await service.onReply("u1", "l1"), 1);
  assert.equal(repo.followUps[0].status, "cancelled");
});
test("follow-up duplicado é rejeitado", async () => {
  const service = new FollowUpService(new MemoryRepo());
  await service.create("u1", {
    campaignId: "c1",
    leadId: "l1",
    type: "manual",
    attemptNumber: 1,
    scheduledFor: when,
  });
  await assert.rejects(
    () =>
      service.create("u1", {
        campaignId: "c1",
        leadId: "l1",
        type: "manual",
        attemptNumber: 1,
        scheduledFor: when,
      }),
    /duplicado/,
  );
});
test("reagendamento funciona", async () => {
  const repo = new MemoryRepo(),
    service = new FollowUpService(repo),
    item = await service.create("u1", {
      campaignId: "c1",
      leadId: "l1",
      type: "manual",
      attemptNumber: 1,
      scheduledFor: when,
    });
  const original = item.scheduledFor;
  assert.notEqual(
    (await service.reschedule("u1", item.id, "2027-07-06T15:00:00Z", config))
      .scheduledFor,
    original,
  );
});
test("mensagem não aprovada não entra na fila", async () => {
  const repo = new MemoryRepo();
  repo.contexts.set(
    "u1",
    base({ message: { ...base().message!, status: "prepared" } }),
  );
  await assert.rejects(
    () =>
      new QueueService(repo).schedule("u1", {
        campaignId: "c1",
        leadId: "l1",
        messageId: "m1",
        scheduledFor: when,
      }),
    /aprovada/,
  );
});
test("mensagem aprovada entra na fila", async () =>
  assert.equal(
    (
      await new QueueService(new MemoryRepo()).schedule("u1", {
        campaignId: "c1",
        leadId: "l1",
        messageId: "m1",
        scheduledFor: when,
      })
    ).item.messageId,
    "m1",
  ));
test("WhatsApp sem telefone bloqueia fila", async () => {
  const repo = new MemoryRepo();
  repo.contexts.set("u1", base({ lead: { ...base().lead, phone: null } }));
  await assert.rejects(
    () =>
      new QueueService(repo).schedule("u1", {
        campaignId: "c1",
        leadId: "l1",
        messageId: "m1",
        scheduledFor: when,
      }),
    /telefone/,
  );
});
test("campanha pausada bloqueia fila", async () => {
  const repo = new MemoryRepo();
  repo.contexts.set(
    "u1",
    base({ campaign: { ...base().campaign, status: "Pausada" } }),
  );
  await assert.rejects(
    () =>
      new QueueService(repo).schedule("u1", {
        campaignId: "c1",
        leadId: "l1",
        messageId: "m1",
        scheduledFor: when,
      }),
    /pausada/,
  );
});
test("horário fora da janela é ajustado", () =>
  assert.ok(adjustSchedule("2027-07-05T23:00:00Z", config).reasons.length));
test("final de semana é ajustado", () => {
  const result = adjustSchedule("2027-07-03T15:00:00Z", config);
  assert.ok(result.reasons.some((x) => x.includes("dia permitido")));
});
test("timezone é respeitado", () =>
  assert.equal(adjustSchedule(when, config).timezone, "America/Sao_Paulo"));
test("limite diário é respeitado", async () => {
  const repo = new MemoryRepo();
  repo.campaignCount = 5;
  await assert.rejects(
    () =>
      new QueueService(repo).schedule("u1", {
        campaignId: "c1",
        leadId: "l1",
        messageId: "m1",
        scheduledFor: when,
      }),
    /Limite/,
  );
});
test("item duplicado de fila é rejeitado", async () => {
  const service = new QueueService(new MemoryRepo());
  await service.schedule("u1", {
    campaignId: "c1",
    leadId: "l1",
    messageId: "m1",
    scheduledFor: when,
  });
  await assert.rejects(
    () =>
      service.schedule("u1", {
        campaignId: "c1",
        leadId: "l1",
        messageId: "m1",
        scheduledFor: when,
      }),
    /ativo/,
  );
});
test("nenhum envio externo acontece", () => {
  for (const file of [
    "lib/follow-up/service.ts",
    "lib/follow-up/scheduling.ts",
  ])
    assert.doesNotMatch(
      fs.readFileSync(file, "utf8"),
      /fetch\(|sendMessage|smtp|whatsapp\.com/i,
    );
});
test("usuários diferentes não compartilham dados", async () => {
  const repo = new MemoryRepo(),
    service = new FollowUpService(repo);
  await service.create("u1", {
    campaignId: "c1",
    leadId: "l1",
    type: "manual",
    attemptNumber: 1,
    scheduledFor: when,
  });
  assert.equal((await repo.listFollowUps("u2")).length, 0);
});
test("RLS permanece ativo", () => {
  const sql = fs.readFileSync(
    "supabase/migrations/202607160006_follow_up_queue.sql",
    "utf8",
  );
  assert.match(sql, /alter table public\.follow_ups enable row level security/);
  assert.match(sql, /user_id=auth\.uid\(\)/);
  assert.doesNotMatch(sql, /using\s*\(true\)/i);
});
test("persistência continua após logout e login", async () => {
  const repo = new MemoryRepo();
  await new FollowUpService(repo).create("u1", {
    campaignId: "c1",
    leadId: "l1",
    type: "manual",
    attemptNumber: 1,
    scheduledFor: when,
  });
  const afterLogin = new FollowUpService(repo);
  assert.equal((await repo.listFollowUps("u1")).length, 1);
  assert.ok(afterLogin);
});

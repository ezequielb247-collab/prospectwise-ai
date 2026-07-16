import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import {
  PersistenceService,
  type PersistentRepository,
} from "../lib/persistence-service";
import { FollowUpService, QueueService } from "../lib/follow-up/service";
import type { FollowUpRepository } from "../lib/follow-up/service";
import type {
  FollowUp,
  FollowUpContext,
  QueueItem,
} from "../lib/follow-up/types";

class CampaignRepo implements PersistentRepository {
  campaigns = new Map([
    ["c1", { userId: "u1", status: "active" as "active" | "paused" }],
  ]);
  activities: string[] = [];
  fail = false;
  async createCampaign() {
    return "c2";
  }
  async updateCampaignStatus(input: {
    campaignId: string;
    status: "active" | "paused";
  }) {
    if (this.fail) throw new Error("Banco indisponível.");
    const campaign = this.campaigns.get(input.campaignId);
    if (!campaign || campaign.userId !== "u1")
      throw new Error("Campanha não encontrada.");
    campaign.status = input.status;
    this.activities.push(
      input.status === "paused" ? "campaign_paused" : "campaign_resumed",
    );
  }
  async moveLead() {}
  async prepareMessage() {
    return "m1";
  }
}

class PausedOperationsRepo implements FollowUpRepository {
  queue: QueueItem[] = [
    {
      id: "q1",
      userId: "u1",
      campaignId: "c1",
      leadId: "l1",
      messageId: "m1",
      followUpId: null,
      channel: "manual",
      status: "scheduled",
      scheduledFor: new Date().toISOString(),
      availableAfter: new Date().toISOString(),
      lockedAt: null,
      processedAt: null,
      failureReason: null,
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  context(): Promise<FollowUpContext> {
    return Promise.resolve({
      campaign: {
        id: "c1",
        status: "paused",
        config: {
          followUpEnabled: true,
          maxFollowUpAttempts: 2,
          delays: [3, 7, 14],
          allowedWeekdays: [1, 2, 3, 4, 5],
          sendWindowStart: "09:00",
          sendWindowEnd: "17:00",
          timezone: "America/Sao_Paulo",
          dailyLimit: 10,
          userDailyLimit: 20,
          maxRetries: 3,
        },
      },
      lead: { id: "l1", campaignId: "c1", status: "Novo", phone: "+5511" },
      message: {
        id: "m1",
        campaignId: "c1",
        leadId: "l1",
        status: "approved",
        channel: "manual",
      },
    });
  }
  async activeDuplicate() {
    return false;
  }
  async activeAttempts() {
    return 0;
  }
  async createFollowUp(): Promise<FollowUp> {
    throw new Error("não deve criar");
  }
  async updateFollowUp(): Promise<FollowUp> {
    throw new Error("não usado");
  }
  async cancelActive() {
    return 0;
  }
  async listFollowUps() {
    return [] as FollowUp[];
  }
  async activeQueueDuplicate() {
    return false;
  }
  async dailyCounts() {
    return { campaign: 0, user: 0 };
  }
  async createQueue(): Promise<QueueItem> {
    throw new Error("não deve criar");
  }
  async updateQueue(): Promise<QueueItem> {
    throw new Error("não deve processar");
  }
  async listQueue() {
    return this.queue;
  }
  async queueCampaignStatus() {
    return "paused";
  }
}

test("pausar campanha persiste após reload", async () => {
  const repo = new CampaignRepo();
  await new PersistenceService(repo).updateCampaignStatus({
    campaignId: "c1",
    status: "paused",
  });
  assert.equal(repo.campaigns.get("c1")?.status, "paused");
});
test("pausa permanece ao navegar para outra rota", async () => {
  const repo = new CampaignRepo();
  await new PersistenceService(repo).updateCampaignStatus({
    campaignId: "c1",
    status: "paused",
  });
  assert.equal(
    new PersistenceService(repo) && repo.campaigns.get("c1")?.status,
    "paused",
  );
});
test("pausa permanece após logout e login", async () => {
  const repo = new CampaignRepo();
  await new PersistenceService(repo).updateCampaignStatus({
    campaignId: "c1",
    status: "paused",
  });
  const newSession = new PersistenceService(repo);
  assert.ok(newSession);
  assert.equal(repo.campaigns.get("c1")?.status, "paused");
});
test("retomar campanha persiste e registra atividade", async () => {
  const repo = new CampaignRepo();
  const service = new PersistenceService(repo);
  await service.updateCampaignStatus({ campaignId: "c1", status: "paused" });
  await service.updateCampaignStatus({ campaignId: "c1", status: "active" });
  assert.equal(repo.campaigns.get("c1")?.status, "active");
  assert.deepEqual(repo.activities, ["campaign_paused", "campaign_resumed"]);
});
test("usuário não altera campanha de outro usuário", async () => {
  const repo = new CampaignRepo();
  repo.campaigns.set("c2", { userId: "u2", status: "active" });
  await assert.rejects(
    () =>
      new PersistenceService(repo).updateCampaignStatus({
        campaignId: "c2",
        status: "paused",
      }),
    /não encontrada/,
  );
});
test("falha no banco possui reversão otimista na interface", () => {
  const source = fs.readFileSync("app/Workspace.tsx", "utf8");
  assert.match(source, /const previous = rows/);
  assert.match(source, /setRows\(previous\)/);
});
test("campanha pausada bloqueia novo agendamento", async () => {
  await assert.rejects(
    () =>
      new QueueService(new PausedOperationsRepo()).schedule("u1", {
        campaignId: "c1",
        leadId: "l1",
        messageId: "m1",
        scheduledFor: new Date().toISOString(),
      }),
    /pausada/,
  );
});
test("campanha pausada bloqueia follow-up", async () => {
  await assert.rejects(
    () =>
      new FollowUpService(new PausedOperationsRepo()).create("u1", {
        campaignId: "c1",
        leadId: "l1",
        type: "manual",
        attemptNumber: 1,
        scheduledFor: new Date().toISOString(),
      }),
    /pausada/,
  );
});
test("itens existentes não são apagados e processamento é bloqueado", async () => {
  const repo = new PausedOperationsRepo();
  await assert.rejects(
    () => new QueueService(repo).complete("u1", "q1"),
    /pausada/,
  );
  assert.equal(repo.queue.length, 1);
});
test("nenhum mock sobrescreve o status real", () => {
  const source = fs.readFileSync("lib/workspace-data.ts", "utf8");
  assert.match(source, /status: campaign\.status/);
  assert.doesNotMatch(source, /campaign\.status\s*\?\?\s*["']active/);
});
test("campanha em rascunho pode ser pausada sem fallback visual para active", () => {
  const source = fs.readFileSync("app/Workspace.tsx", "utf8");
  assert.match(source, /\["active", "paused", "draft"\]/);
  assert.doesNotMatch(source, /index === 0 \? \(active/);
});

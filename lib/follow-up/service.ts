import { adjustSchedule } from "./scheduling";
import type {
  FollowUp,
  FollowUpContext,
  FollowUpType,
  QueueItem,
} from "./types";
export interface FollowUpRepository {
  context(
    userId: string,
    campaignId: string,
    leadId: string,
    messageId?: string,
  ): Promise<FollowUpContext | undefined>;
  activeDuplicate(
    userId: string,
    leadId: string,
    type: FollowUpType,
    attempt: number,
  ): Promise<boolean>;
  activeAttempts(userId: string, leadId: string): Promise<number>;
  createFollowUp(
    userId: string,
    input: Omit<FollowUp, "id" | "userId" | "createdAt" | "updatedAt">,
    activity: string,
  ): Promise<FollowUp>;
  updateFollowUp(
    userId: string,
    id: string,
    patch: Partial<FollowUp>,
    activity: string,
  ): Promise<FollowUp>;
  cancelActive(userId: string, leadId: string, reason: string): Promise<number>;
  listFollowUps(userId: string): Promise<FollowUp[]>;
  activeQueueDuplicate(userId: string, messageId: string): Promise<boolean>;
  dailyCounts(
    userId: string,
    campaignId: string,
    date: string,
  ): Promise<{ campaign: number; user: number }>;
  createQueue(
    userId: string,
    input: Omit<QueueItem, "id" | "userId" | "createdAt" | "updatedAt">,
  ): Promise<QueueItem>;
  updateQueue(
    userId: string,
    id: string,
    patch: Partial<QueueItem>,
  ): Promise<QueueItem>;
  listQueue(userId: string): Promise<QueueItem[]>;
}
const forbidden = new Set(["Opt-out", "Cliente", "Sem interesse"]);
export class FollowUpService {
  constructor(private repo: FollowUpRepository) {}
  async create(
    userId: string,
    input: {
      campaignId: string;
      leadId: string;
      messageId?: string;
      type: FollowUpType;
      attemptNumber: number;
      scheduledFor: string;
      reason?: string;
      notes?: string;
      manualReopen?: boolean;
    },
  ) {
    const context = await this.repo.context(
      userId,
      input.campaignId,
      input.leadId,
      input.messageId,
    );
    if (!context) throw new Error("Lead não pertence à campanha.");
    if (
      ["Pausada", "paused", "Arquivada", "archived"].includes(
        context.campaign.status,
      )
    )
      throw new Error("Campanha pausada ou arquivada.");
    if (
      forbidden.has(context.lead.status) &&
      !(input.manualReopen && context.lead.status === "Sem interesse")
    )
      throw new Error(`Lead ${context.lead.status} bloqueia follow-up.`);
    if (!context.campaign.config.followUpEnabled && input.type !== "manual")
      throw new Error("Follow-up automático desabilitado.");
    if (
      input.attemptNumber > context.campaign.config.maxFollowUpAttempts ||
      (await this.repo.activeAttempts(userId, input.leadId)) >=
        context.campaign.config.maxFollowUpAttempts
    )
      throw new Error("Limite de tentativas atingido.");
    if (
      await this.repo.activeDuplicate(
        userId,
        input.leadId,
        input.type,
        input.attemptNumber,
      )
    )
      throw new Error("Follow-up ativo duplicado.");
    const schedule = adjustSchedule(
      input.scheduledFor,
      context.campaign.config,
    );
    return this.repo.createFollowUp(
      userId,
      {
        campaignId: input.campaignId,
        leadId: input.leadId,
        messageId: input.messageId ?? null,
        type: input.type,
        status:
          new Date(schedule.scheduledFor) <= new Date() ? "due" : "pending",
        attemptNumber: input.attemptNumber,
        scheduledFor: schedule.scheduledFor,
        completedAt: null,
        cancelledAt: null,
        reason: (input.reason ?? schedule.reasons.join(" ")) || null,
        notes: (input.notes ?? "").replace(/[<>]/g, "") || null,
      },
      "follow_up_created",
    );
  }
  async reschedule(
    userId: string,
    id: string,
    scheduledFor: string,
    config: FollowUpContext["campaign"]["config"],
  ) {
    const adjusted = adjustSchedule(scheduledFor, config);
    return this.repo.updateFollowUp(
      userId,
      id,
      {
        scheduledFor: adjusted.scheduledFor,
        status: "pending",
        reason: adjusted.reasons.join(" ") || null,
      },
      "follow_up_rescheduled",
    );
  }
  complete(userId: string, id: string) {
    return this.repo.updateFollowUp(
      userId,
      id,
      { status: "completed", completedAt: new Date().toISOString() },
      "follow_up_completed",
    );
  }
  cancel(userId: string, id: string, reason: string) {
    return this.repo.updateFollowUp(
      userId,
      id,
      { status: "cancelled", cancelledAt: new Date().toISOString(), reason },
      "follow_up_cancelled",
    );
  }
  onReply(userId: string, leadId: string) {
    return this.repo.cancelActive(userId, leadId, "Resposta recebida.");
  }
}
export class QueueService {
  constructor(private repo: FollowUpRepository) {}
  async schedule(
    userId: string,
    input: {
      campaignId: string;
      leadId: string;
      messageId: string;
      followUpId?: string;
      scheduledFor: string;
    },
  ) {
    const context = await this.repo.context(
      userId,
      input.campaignId,
      input.leadId,
      input.messageId,
    );
    if (!context || !context.message)
      throw new Error("Mensagem, lead ou campanha incompatível.");
    if (context.message.status !== "approved")
      throw new Error("Somente mensagem aprovada pode entrar na fila.");
    if (context.lead.status === "Opt-out")
      throw new Error("Lead Opt-out bloqueia fila.");
    if (
      ["Pausada", "paused", "Arquivada", "archived"].includes(
        context.campaign.status,
      )
    )
      throw new Error("Campanha pausada bloqueia fila.");
    if (context.message.channel === "whatsapp" && !context.lead.phone)
      throw new Error("WhatsApp sem telefone bloqueia fila.");
    if (await this.repo.activeQueueDuplicate(userId, input.messageId))
      throw new Error("Mensagem já possui item ativo na fila.");
    const adjusted = adjustSchedule(
        input.scheduledFor,
        context.campaign.config,
      ),
      counts = await this.repo.dailyCounts(
        userId,
        input.campaignId,
        adjusted.scheduledFor,
      );
    if (
      counts.campaign >= context.campaign.config.dailyLimit ||
      counts.user >= context.campaign.config.userDailyLimit
    )
      throw new Error("Limite diário atingido.");
    return {
      item: await this.repo.createQueue(userId, {
        campaignId: input.campaignId,
        leadId: input.leadId,
        messageId: input.messageId,
        followUpId: input.followUpId ?? null,
        channel: context.message.channel,
        status:
          new Date(adjusted.scheduledFor) <= new Date() ? "ready" : "scheduled",
        scheduledFor: adjusted.scheduledFor,
        availableAfter: adjusted.scheduledFor,
        lockedAt: null,
        processedAt: null,
        failureReason: null,
        retryCount: 0,
      }),
      preview: adjusted,
    };
  }
  complete(userId: string, id: string) {
    return this.repo.updateQueue(userId, id, {
      status: "completed",
      processedAt: new Date().toISOString(),
    });
  }
  cancel(userId: string, id: string) {
    return this.repo.updateQueue(userId, id, { status: "cancelled" });
  }
  pending(userId: string, id: string) {
    return this.repo.updateQueue(userId, id, {
      status: "pending",
      processedAt: null,
    });
  }
}

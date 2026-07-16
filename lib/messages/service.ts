/* eslint-disable @typescript-eslint/no-unused-vars */
import { MessageTemplateEngine } from "./template-engine";
import type { CommercialMessage, MessageContext, Template } from "./types";
export interface MessageRepository {
  context(
    userId: string,
    leadId: string,
    campaignId: string,
  ): Promise<MessageContext | undefined>;
  template(userId: string, id: string): Promise<Template | undefined>;
  message(userId: string, id: string): Promise<CommercialMessage | undefined>;
  list(userId: string): Promise<CommercialMessage[]>;
  hasFirstContact(
    userId: string,
    leadId: string,
    campaignId: string,
  ): Promise<boolean>;
  isOptedOut(userId: string, phone: string): Promise<boolean>;
  save(
    userId: string,
    input: Omit<
      CommercialMessage,
      | "id"
      | "userId"
      | "createdAt"
      | "updatedAt"
      | "leadName"
      | "campaignName"
      | "templateName"
    >,
    activity: string,
  ): Promise<CommercialMessage>;
  update(
    userId: string,
    id: string,
    patch: Partial<CommercialMessage>,
    activity: string,
  ): Promise<CommercialMessage>;
  templates(userId: string): Promise<Template[]>;
  seedTemplates(userId: string): Promise<number>;
}
export class MessageService {
  constructor(
    private repo: MessageRepository,
    private engine = new MessageTemplateEngine(),
  ) {}
  async preview(
    userId: string,
    input: { leadId: string; campaignId: string; templateId: string },
  ) {
    const [context, template] = await Promise.all([
      this.repo.context(userId, input.leadId, input.campaignId),
      this.repo.template(userId, input.templateId),
    ]);
    if (!context) throw new Error("Lead não pertence à campanha.");
    if (!template) throw new Error("Template não encontrado.");
    if (
      context.lead.crmStage === "Opt-out" ||
      (context.lead.phone &&
        (await this.repo.isOptedOut(userId, context.lead.phone)))
    )
      throw new Error("Lead com opt-out não pode receber mensagem.");
    if (template.channel === "whatsapp" && !context.lead.phone)
      throw new Error("Lead sem telefone não pode usar canal WhatsApp.");
    return { context, template, ...this.engine.render(context, template) };
  }
  async create(
    userId: string,
    input: {
      leadId: string;
      campaignId: string;
      templateId: string;
      body?: string;
      status: "draft" | "prepared";
      allowDuplicate?: boolean;
    },
  ) {
    const rendered = await this.preview(userId, input);
    if (
      rendered.template.type === "first_contact" &&
      !input.allowDuplicate &&
      (await this.repo.hasFirstContact(userId, input.leadId, input.campaignId))
    )
      throw new Error(
        "Já existe uma primeira abordagem. Confirme a duplicação.",
      );
    const now = new Date().toISOString();
    return this.repo.save(
      userId,
      {
        campaignId: input.campaignId,
        leadId: input.leadId,
        templateId: input.templateId,
        type: rendered.template.type,
        channel: rendered.template.channel,
        subject: null,
        body: (input.body ?? rendered.body).replace(/[<>]/g, ""),
        status: input.status,
        version: rendered.templateVersion,
        approvedAt: null,
        scheduledAt: null,
        sentAt: null,
        respondedAt: null,
        warnings: rendered.warnings,
      },
      input.status === "prepared" ? "message_prepared" : "message_created",
    );
  }
  async transition(
    userId: string,
    id: string,
    status: "draft" | "prepared" | "approved" | "cancelled",
  ) {
    const message = await this.repo.message(userId, id);
    if (!message) throw new Error("Mensagem não encontrada.");
    if (message.status === "cancelled" && status === "approved")
      throw new Error("Reabra como rascunho antes de aprovar.");
    const activities: Record<string, string> = {
      draft: "message_updated",
      prepared: "message_prepared",
      approved: "message_approved",
      cancelled: "message_cancelled",
    };
    return this.repo.update(
      userId,
      id,
      {
        status,
        approvedAt: status === "approved" ? new Date().toISOString() : null,
      },
      activities[status],
    );
  }
  async edit(userId: string, id: string, body: string) {
    const message = await this.repo.message(userId, id);
    if (!message) throw new Error("Mensagem não encontrada.");
    if (message.status === "approved")
      throw new Error("Volte a mensagem para rascunho antes de editar.");
    return this.repo.update(
      userId,
      id,
      { body: body.replace(/[<>]/g, "") },
      "message_updated",
    );
  }
  async duplicate(userId: string, id: string) {
    const message = await this.repo.message(userId, id);
    if (!message) throw new Error("Mensagem não encontrada.");
    return this.repo.save(
      userId,
      {
        campaignId: message.campaignId,
        leadId: message.leadId,
        templateId: message.templateId,
        type: message.type,
        channel: message.channel,
        subject: message.subject,
        body: message.body,
        status: "draft",
        version: message.version,
        approvedAt: null,
        scheduledAt: null,
        sentAt: null,
        respondedAt: null,
        warnings: message.warnings,
      },
      "message_duplicated",
    );
  }
  async bulk(
    userId: string,
    input: {
      campaignId: string;
      leadIds: string[];
      templateId: string;
      allowDuplicate?: boolean;
    },
  ) {
    const created: CommercialMessage[] = [];
    const skipped: string[] = [];
    for (const leadId of input.leadIds)
      try {
        created.push(
          await this.create(userId, { ...input, leadId, status: "draft" }),
        );
      } catch (error) {
        skipped.push(
          `${leadId}: ${error instanceof Error ? error.message : "ignorado"}`,
        );
      }
    return { created, skipped };
  }
}

import { z } from "zod";
import { requireApiUser } from "../../../lib/auth/session";
import { followUpForUser } from "../../../lib/follow-up/container";
import { FOLLOW_UP_TYPES } from "../../../lib/follow-up/types";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    campaignId: z.string(),
    leadId: z.string(),
    messageId: z.string().optional(),
    type: z.enum(FOLLOW_UP_TYPES),
    attemptNumber: z.number().int().positive(),
    scheduledFor: z.string(),
    reason: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
    manualReopen: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("reschedule"),
    id: z.string(),
    scheduledFor: z.string(),
  }),
  z.object({ action: z.literal("complete"), id: z.string() }),
  z.object({
    action: z.literal("cancel"),
    id: z.string(),
    reason: z.string().max(500),
  }),
]);
export async function GET() {
  try {
    const user = await requireApiUser();
    const { repo } = await followUpForUser();
    return Response.json(await repo.listFollowUps(user.id));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao listar follow-ups.",
      },
      { status: 400 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireApiUser(),
      input = schema.parse(await request.json());
    const { repo, followUps } = await followUpForUser();
    if (input.action === "create")
      return Response.json(await followUps.create(user.id, input));
    if (input.action === "complete")
      return Response.json(await followUps.complete(user.id, input.id));
    if (input.action === "cancel")
      return Response.json(
        await followUps.cancel(user.id, input.id, input.reason),
      );
    const item = (await repo.listFollowUps(user.id)).find(
      (entry) => entry.id === input.id,
    );
    if (!item) throw new Error("Follow-up não encontrado.");
    const context = await repo.context(
      user.id,
      item.campaignId,
      item.leadId,
      item.messageId ?? undefined,
    );
    if (!context) throw new Error("Contexto inválido.");
    return Response.json(
      await followUps.reschedule(
        user.id,
        item.id,
        input.scheduledFor,
        context.campaign.config,
      ),
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha no follow-up." },
      { status: 400 },
    );
  }
}

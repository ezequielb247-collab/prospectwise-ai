import { z } from "zod";
import { requireApiUser } from "../../../lib/auth/session";
import { followUpForUser } from "../../../lib/follow-up/container";
import { adjustSchedule } from "../../../lib/follow-up/scheduling";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("schedule"),
    campaignId: z.string(),
    leadId: z.string(),
    messageId: z.string(),
    followUpId: z.string().optional(),
    scheduledFor: z.string(),
  }),
  z.object({
    action: z.enum(["complete", "cancel", "pending"]),
    id: z.string(),
  }),
  z.object({
    action: z.literal("reschedule"),
    id: z.string(),
    scheduledFor: z.string(),
  }),
]);
export async function GET() {
  try {
    const user = await requireApiUser();
    const { repo } = await followUpForUser();
    return Response.json(await repo.listQueue(user.id));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Falha ao listar fila.",
      },
      { status: 400 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireApiUser(),
      input = schema.parse(await request.json());
    const { repo, queue } = await followUpForUser();
    if (input.action === "schedule")
      return Response.json(await queue.schedule(user.id, input));
    if (input.action === "complete")
      return Response.json(await queue.complete(user.id, input.id));
    if (input.action === "cancel")
      return Response.json(await queue.cancel(user.id, input.id));
    if (input.action === "pending")
      return Response.json(await queue.pending(user.id, input.id));
    if (input.action !== "reschedule") throw new Error("Ação inválida.");
    const item = (await repo.listQueue(user.id)).find(
      (entry) => entry.id === input.id,
    );
    if (!item) throw new Error("Item não encontrado.");
    const context = await repo.context(
      user.id,
      item.campaignId,
      item.leadId,
      item.messageId,
    );
    if (!context) throw new Error("Contexto inválido.");
    const adjusted = adjustSchedule(
      input.scheduledFor,
      context.campaign.config,
    );
    return Response.json({
      item: await repo.updateQueue(user.id, item.id, {
        scheduledFor: adjusted.scheduledFor,
        availableAfter: adjusted.scheduledFor,
        status: "scheduled",
      }),
      preview: adjusted,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha na fila." },
      { status: 400 },
    );
  }
}

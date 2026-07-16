import { z } from "zod";
import { requireApiUser } from "../../../lib/auth/session";
import { salesProduct } from "../../../lib/sales-product/container";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "../../../lib/sales-product/types";
const createSchema = z.object({
  leadId: z.string().uuid(),
  campaignId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(180),
  description: z.string().max(2000).nullable().optional(),
  type: z.enum(TASK_TYPES),
  priority: z.enum(TASK_PRIORITIES),
  scheduledFor: z.string().datetime(),
});
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...createSchema.shape }),
  z.object({
    action: z.literal("update"),
    id: z.string().uuid(),
    title: z.string().min(1).max(180).optional(),
    description: z.string().max(2000).nullable().optional(),
    type: z.enum(TASK_TYPES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    scheduledFor: z.string().datetime().optional(),
    status: z.enum(TASK_STATUSES).optional(),
  }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);
export async function GET() {
  try {
    const user = await requireApiUser();
    return Response.json(await (await salesProduct()).tasks.list(user.id));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao listar tarefas.",
      },
      { status: 400 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireApiUser(),
      input = actionSchema.parse(await request.json()),
      { tasks } = await salesProduct();
    if (input.action === "create")
      return Response.json(await tasks.create(user.id, input), { status: 201 });
    if (input.action === "delete") {
      await tasks.delete(user.id, input.id);
      return Response.json({ ok: true });
    }
    const { action, id, ...patch } = input;
    void action;
    return Response.json(await tasks.update(user.id, id, patch));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao salvar tarefa.",
      },
      { status: 400 },
    );
  }
}

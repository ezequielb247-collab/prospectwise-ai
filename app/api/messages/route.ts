import { z } from "zod";
import { requireApiUser } from "../../../lib/auth/session";
import { messagesForUser } from "../../../lib/messages/container";
const create = z.object({
  action: z.literal("create"),
  leadId: z.string(),
  campaignId: z.string(),
  templateId: z.string(),
  body: z.string().optional(),
  status: z.enum(["draft", "prepared"]),
  allowDuplicate: z.boolean().optional(),
});
const preview = z.object({
  action: z.literal("preview"),
  leadId: z.string(),
  campaignId: z.string(),
  templateId: z.string(),
});
const bulk = z.object({
  action: z.literal("bulk"),
  campaignId: z.string(),
  leadIds: z.array(z.string()).min(1),
  templateId: z.string(),
  allowDuplicate: z.boolean().optional(),
});
const seed = z.object({ action: z.literal("seed") });
const schema = z.discriminatedUnion("action", [create, preview, bulk, seed]);
export async function GET() {
  try {
    const user = await requireApiUser();
    const { repo } = await messagesForUser();
    return Response.json({
      messages: await repo.list(user.id),
      templates: await repo.templates(user.id),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao listar mensagens.",
      },
      { status: 400 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const { repo, service } = await messagesForUser();
    const input = schema.parse(await request.json());
    if (input.action === "preview")
      return Response.json(await service.preview(user.id, input));
    if (input.action === "create")
      return Response.json(await service.create(user.id, input));
    if (input.action === "bulk")
      return Response.json(await service.bulk(user.id, input));
    return Response.json({ created: await repo.seedTemplates(user.id) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao processar mensagem.",
      },
      { status: 400 },
    );
  }
}

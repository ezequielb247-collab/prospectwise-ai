import { z } from "zod";
import { requireApiUser } from "../../../lib/auth/session";
import { salesProduct } from "../../../lib/sales-product/container";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    leadId: z.string().uuid(),
    text: z.string().min(1).max(4000),
  }),
  z.object({
    action: z.literal("update"),
    id: z.string().uuid(),
    text: z.string().min(1).max(4000),
  }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);
export async function GET(request: Request) {
  try {
    const user = await requireApiUser(),
      leadId = new URL(request.url).searchParams.get("leadId");
    if (!leadId)
      return Response.json({ error: "Lead obrigatório." }, { status: 400 });
    return Response.json(
      await (await salesProduct()).notes.list(user.id, leadId),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao listar notas.",
      },
      { status: 400 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireApiUser(),
      input = schema.parse(await request.json()),
      { notes } = await salesProduct();
    if (input.action === "create")
      return Response.json(
        await notes.create(user.id, input.leadId, input.text),
        { status: 201 },
      );
    if (input.action === "update")
      return Response.json(await notes.update(user.id, input.id, input.text));
    await notes.delete(user.id, input.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Falha ao salvar nota.",
      },
      { status: 400 },
    );
  }
}

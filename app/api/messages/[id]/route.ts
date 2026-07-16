import { z } from "zod";
import { requireApiUser } from "../../../../lib/auth/session";
import { messagesForUser } from "../../../../lib/messages/container";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("edit"), body: z.string().min(1).max(10000) }),
  z.object({
    action: z.literal("transition"),
    status: z.enum(["draft", "prepared", "approved", "cancelled"]),
  }),
  z.object({ action: z.literal("duplicate") }),
]);
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const { service } = await messagesForUser();
    const input = schema.parse(await request.json());
    if (input.action === "edit")
      return Response.json(await service.edit(user.id, id, input.body));
    if (input.action === "duplicate")
      return Response.json(await service.duplicate(user.id, id));
    return Response.json(await service.transition(user.id, id, input.status));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao atualizar mensagem.",
      },
      { status: 400 },
    );
  }
}

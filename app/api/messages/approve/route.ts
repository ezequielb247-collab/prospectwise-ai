import { z } from "zod";
import { requireApiUser } from "../../../../lib/auth/session";
import { messagesForUser } from "../../../../lib/messages/container";
const schema = z.object({ messageId: z.string().min(1) });
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = schema.parse(await request.json());
    const { service } = await messagesForUser();
    return Response.json(
      await service.transition(user.id, input.messageId, "approved"),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao aprovar mensagem.",
      },
      { status: 400 },
    );
  }
}

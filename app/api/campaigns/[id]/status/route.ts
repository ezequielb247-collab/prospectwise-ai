import { z } from "zod";
import { requireApiUser } from "../../../../../lib/auth/session";
import { persistenceForUser } from "../../../../../lib/persistence-container";

const schema = z.object({ status: z.enum(["active", "paused"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const { status } = schema.parse(await request.json());
    const service = await persistenceForUser(user.id);
    await service.updateCampaignStatus({ campaignId: id, status });
    return Response.json({ id, status });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a campanha.",
      },
      { status: 400 },
    );
  }
}

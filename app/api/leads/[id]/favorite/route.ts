import { z } from "zod";
import { requireApiUser } from "../../../../../lib/auth/session";
import { salesProduct } from "../../../../../lib/sales-product/container";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser(),
      { id } = await params,
      { favorite } = z
        .object({ favorite: z.boolean() })
        .parse(await request.json());
    await (await salesProduct()).notes.favorite(user.id, id, favorite);
    return Response.json({ id, favorite });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao favoritar lead.",
      },
      { status: 400 },
    );
  }
}

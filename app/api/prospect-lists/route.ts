import { z } from "zod";
import { requireApiUser } from "../../../lib/auth/session";
import { prospectLists } from "../../../lib/prospect-lists/container";

const uuid = z.string().uuid();
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    name: z.string().min(1),
    description: z.string().optional(),
    campaignId: uuid.nullable().optional(),
  }),
  z.object({ action: z.literal("rename"), id: uuid, name: z.string().min(1) }),
  z.object({ action: z.literal("delete"), id: uuid }),
  z.object({
    action: z.literal("add"),
    listId: uuid,
    leadIds: z.array(uuid).min(1),
  }),
  z.object({ action: z.literal("remove"), id: uuid, leadId: uuid }),
]);

function apiError(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    const field = String(issue?.path?.[0] ?? "");
    if (field === "listId" || field === "id") return "Lista inválida.";
    if (field === "leadId" || field === "leadIds")
      return "Um ou mais leads são inválidos.";
    if (field === "campaignId") return "Campanha inválida.";
    if (field === "name") return "Informe um nome válido para a lista.";
    return "Dados inválidos para a lista.";
  }
  return error instanceof Error ? error.message : fallback;
}

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const id = new URL(request.url).searchParams.get("id");
    const service = await prospectLists();
    return Response.json(id ? await service.get(user.id, id) : await service.list(user.id));
  } catch (error) {
    return Response.json({ error: apiError(error, "Falha ao carregar listas.") }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const input = schema.parse(await request.json());
    const service = await prospectLists();

    if (input.action === "create")
      return Response.json(await service.create(user.id, input), { status: 201 });
    if (input.action === "rename")
      return Response.json(await service.rename(user.id, input.id, input.name));
    if (input.action === "add")
      return Response.json(await service.add(user.id, input.listId, input.leadIds));
    if (input.action === "remove") {
      await service.remove(user.id, input.id, input.leadId);
      return Response.json({ ok: true });
    }

    await service.delete(user.id, input.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: apiError(error, "Falha ao salvar lista.") }, { status: 400 });
  }
}

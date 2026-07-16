import { z } from "zod";
import { requireApiUser } from "../../../../../lib/auth/session";
import { intelligenceForUser } from "../../../../../lib/intelligence/container";

const batchSchema = z.object({
  leadIds: z.array(z.string().uuid()).max(100).optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
  recalculate: z.boolean().default(false),
});

function summary(
  analyses: Awaited<
    ReturnType<
      Awaited<ReturnType<typeof intelligenceForUser>>["service"]["getCampaignAnalyses"]
    >
  >,
) {
  const services = new Map<string, number>();
  for (const analysis of analyses)
    for (const service of analysis.recommendedServices)
      services.set(service.name, (services.get(service.name) ?? 0) + 1);
  return {
    analyses,
    averageScore: analyses.length
      ? Math.round(
          analyses.reduce((sum, item) => sum + item.score, 0) / analyses.length,
        )
      : 0,
    excellent: analyses.filter((item) => item.classification === "Excelente")
      .length,
    highPriority: analyses.filter((item) => item.priority === "Alta").length,
    topServices: [...services.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count })),
  };
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, user] = await Promise.all([params, requireApiUser()]);
    const { service } = await intelligenceForUser(user.id);
    return Response.json(summary(await service.getCampaignAnalyses(id)));
  } catch {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, user, input] = await Promise.all([
      params,
      requireApiUser(),
      request.json().catch(() => ({})).then((body) => batchSchema.parse(body)),
    ]);
    const { service } = await intelligenceForUser(user.id);
    if (input.leadIds) {
      const analyses = await service.analyzeLeadIds(id, input.leadIds, {
        recalculate: input.recalculate,
      });
      return Response.json({
        analyses,
        processed: analyses.length,
        total: input.leadIds.length,
        done: true,
      });
    }
    return Response.json(
      await service.analyzeCampaignBatch(id, {
        offset: input.offset,
        limit: input.limit,
        recalculate: input.recalculate,
      }),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao analisar campanha.",
      },
      { status: 400 },
    );
  }
}

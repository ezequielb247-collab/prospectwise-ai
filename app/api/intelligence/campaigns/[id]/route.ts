import { z } from "zod";
import { requireApiUser } from "../../../../../lib/auth/session";
import { intelligenceForUser } from "../../../../../lib/intelligence/container";
import type { AnalysisEvent } from "../../../../../lib/intelligence/lead-intelligence-service";

const endpoint = "/api/intelligence/campaigns/[id]";
const batchSchema = z.object({
  leadIds: z.array(z.string().uuid()).max(100).optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
  recalculate: z.boolean().default(false),
});

type ErrorLike = {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

export function campaignAnalysisDiagnostics(error: unknown) {
  const value = (
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) }
  ) as ErrorLike;
  return {
    name:
      typeof value.name === "string"
        ? value.name
        : error instanceof Error
          ? error.name
          : "UnknownError",
    message: typeof value.message === "string" ? value.message : String(error),
    code: typeof value.code === "string" ? value.code : undefined,
    details: typeof value.details === "string" ? value.details : undefined,
    hint: typeof value.hint === "string" ? value.hint : undefined,
    stack:
      typeof value.stack === "string"
        ? value.stack
        : error instanceof Error
          ? error.stack
          : undefined,
  };
}

function logEvent(
  campaignId: string | null,
  userId: string | null,
  event: AnalysisEvent | { stage: "request_complete"; elapsedMs: number },
) {
  if (event.stage === "lead_error") {
    const error = campaignAnalysisDiagnostics(event.error);
    console.error("Campaign analysis lead failed", {
      endpoint,
      campaignId,
      userId,
      stage: event.stage,
      leadId: event.leadId,
      name: error.name,
      message: error.message,
      code: error.code ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
      stack: error.stack ?? null,
    });
    return;
  }
  console.info("Campaign analysis", { endpoint, campaignId, userId, ...event });
}

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
  const startedAt = Date.now();
  let campaignId: string | null = null;
  let userId: string | null = null;
  try {
    const [{ id }, user, input] = await Promise.all([
      params,
      requireApiUser(),
      request.json().catch(() => ({})).then((body) => batchSchema.parse(body)),
    ]);
    campaignId = id;
    userId = user.id;
    const { service } = await intelligenceForUser(user.id);
    const onEvent = (event: AnalysisEvent) => logEvent(id, user.id, event);

    if (input.leadIds) {
      const context = await service.getCampaignContext(id);
      onEvent({ stage: "campaign_found", found: context.found });
      onEvent({ stage: "leads_count", count: context.count });
      onEvent({ stage: "analysis_start", count: input.leadIds.length });
      onEvent({ stage: "batch_start", offset: 0, limit: input.leadIds.length });
      if (!context.found) throw new Error("Campanha não encontrada.");
      const analyses = await service.analyzeLeadIds(id, input.leadIds, {
        recalculate: input.recalculate,
        continueOnError: true,
        onEvent,
      });
      onEvent({ stage: "batch_complete", count: analyses.length });
      return Response.json({
        analyses,
        processed: input.leadIds.length,
        analyzed: analyses.length,
        failed: input.leadIds.length - analyses.length,
        total: input.leadIds.length,
        done: true,
      });
    }

    return Response.json(
      await service.analyzeCampaignBatch(id, {
        offset: input.offset,
        limit: input.limit,
        recalculate: input.recalculate,
        onEvent,
      }),
    );
  } catch (error) {
    const info = campaignAnalysisDiagnostics(error);
    console.error("Campaign analysis failed", {
      endpoint,
      campaignId,
      userId,
      name: info.name,
      message: info.message,
      code: info.code ?? null,
      details: info.details ?? null,
      hint: info.hint ?? null,
      stack: info.stack ?? null,
      elapsedMs: Date.now() - startedAt,
    });
    return Response.json(
      process.env.NODE_ENV === "development"
        ? {
            error: "Falha ao analisar campanha.",
            name: info.name,
            message: info.message,
            code: info.code,
            details: info.details,
            hint: info.hint,
            stack: info.stack,
          }
        : { error: "Falha ao analisar campanha." },
      { status: 400 },
    );
  } finally {
    logEvent(campaignId, userId, {
      stage: "request_complete",
      elapsedMs: Date.now() - startedAt,
    });
  }
}

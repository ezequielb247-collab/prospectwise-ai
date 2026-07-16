import { LeadScoringEngine } from "./lead-scoring-engine";
import type {
  IntelligenceActivityRepository,
  LeadAnalysisRepository,
  LeadIntelligenceDataSource,
} from "./repositories";

export type AnalysisEvent = {
  stage:
    | "campaign_found"
    | "leads_count"
    | "analysis_start"
    | "batch_start"
    | "lead_error"
    | "persistence"
    | "score_updated"
    | "priority_updated"
    | "radar_updated"
    | "batch_complete";
  leadId?: string;
  found?: boolean;
  count?: number;
  offset?: number;
  limit?: number;
  error?: unknown;
  score?: number;
  priority?: string;
};

type AnalysisObserver = (event: AnalysisEvent) => void;

export class LeadIntelligenceService {
  constructor(
    private readonly dataSource: LeadIntelligenceDataSource,
    private readonly engine: LeadScoringEngine,
    private readonly analyses: LeadAnalysisRepository,
    private readonly activities: IntelligenceActivityRepository,
  ) {}

  async getAnalysis(leadId: string) {
    return this.analyses.findByLeadId(leadId);
  }

  async getCampaignContext(campaignId: string) {
    const [found, count] = await Promise.all([
      this.dataSource.campaignExists(campaignId),
      this.dataSource.countLeadsByCampaignId(campaignId),
    ]);
    return { found, count };
  }

  async analyzeLead(
    leadId: string,
    options: {
      recalculate?: boolean;
      campaignId?: string;
      onEvent?: AnalysisObserver;
    } = {},
  ) {
    const lead = await this.dataSource.findLeadById(leadId);
    if (!lead || (options.campaignId && lead.campaignId !== options.campaignId))
      throw new Error("Lead não encontrado na campanha.");
    const existing = await this.analyses.findByLeadId(leadId);
    if (existing && !options.recalculate) return existing;
    const saved = await this.analyses.upsert(this.engine.analyze(lead));
    options.onEvent?.({ stage: "persistence", leadId });
    options.onEvent?.({ stage: "score_updated", leadId, score: saved.score });
    options.onEvent?.({
      stage: "priority_updated",
      leadId,
      priority: saved.priority,
    });
    await this.activities.record({
      type: existing ? "lead_analysis_recalculated" : "lead_score_calculated",
      leadId,
      campaignId: lead.campaignId,
      createdAt: saved.analyzedAt,
    });
    options.onEvent?.({ stage: "radar_updated", leadId });
    return saved;
  }

  async analyzeLeadIds(
    campaignId: string,
    leadIds: string[],
    options: {
      recalculate?: boolean;
      continueOnError?: boolean;
      onEvent?: AnalysisObserver;
    } = {},
  ) {
    const results = await Promise.allSettled(
      leadIds.map((leadId) =>
        this.analyzeLead(leadId, { ...options, campaignId }),
      ),
    );
    const analyses = [];
    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      if (result.status === "fulfilled") analyses.push(result.value);
      else {
        options.onEvent?.({
          stage: "lead_error",
          leadId: leadIds[index],
          error: result.reason,
        });
        if (!options.continueOnError) throw result.reason;
      }
    }
    return analyses;
  }

  async analyzeCampaignBatch(
    campaignId: string,
    options: {
      offset?: number;
      limit?: number;
      recalculate?: boolean;
      onEvent?: AnalysisObserver;
    } = {},
  ) {
    const offset = options.offset ?? 0;
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const [campaignFound, leads, total] = await Promise.all([
      this.dataSource.campaignExists(campaignId),
      this.dataSource.findLeadsByCampaignId(campaignId, { offset, limit }),
      this.dataSource.countLeadsByCampaignId(campaignId),
    ]);
    options.onEvent?.({ stage: "campaign_found", found: campaignFound });
    options.onEvent?.({ stage: "leads_count", count: total });
    options.onEvent?.({ stage: "analysis_start", count: leads.length });
    options.onEvent?.({ stage: "batch_start", offset, limit });
    if (!campaignFound) throw new Error("Campanha não encontrada.");
    const analyses = await this.analyzeLeadIds(
      campaignId,
      leads.map((lead) => lead.id),
      {
        recalculate: options.recalculate,
        continueOnError: true,
        onEvent: options.onEvent,
      },
    );
    options.onEvent?.({ stage: "batch_complete", count: analyses.length });
    const nextOffset = offset + leads.length;
    return {
      analyses,
      processed: leads.length,
      analyzed: analyses.length,
      failed: leads.length - analyses.length,
      total,
      nextOffset,
      done: nextOffset >= total,
    };
  }

  async analyzeCampaign(campaignId: string) {
    const leads = await this.dataSource.findLeadsByCampaignId(campaignId);
    return this.analyzeLeadIds(
      campaignId,
      leads.map((lead) => lead.id),
    );
  }

  async getCampaignAnalyses(campaignId: string) {
    return this.analyses.findByCampaignId(campaignId);
  }
}

import { LeadScoringEngine } from "./lead-scoring-engine";
import type {
  IntelligenceActivityRepository,
  LeadAnalysisRepository,
  LeadIntelligenceDataSource,
} from "./repositories";

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

  async analyzeLead(
    leadId: string,
    options: { recalculate?: boolean; campaignId?: string } = {},
  ) {
    const lead = await this.dataSource.findLeadById(leadId);
    if (!lead || (options.campaignId && lead.campaignId !== options.campaignId))
      throw new Error("Lead não encontrado na campanha.");
    const existing = await this.analyses.findByLeadId(leadId);
    if (existing && !options.recalculate) return existing;
    const saved = await this.analyses.upsert(this.engine.analyze(lead));
    await this.activities.record({
      type: existing ? "lead_analysis_recalculated" : "lead_score_calculated",
      leadId,
      campaignId: lead.campaignId,
      createdAt: saved.analyzedAt,
    });
    return saved;
  }

  async analyzeLeadIds(
    campaignId: string,
    leadIds: string[],
    options: { recalculate?: boolean } = {},
  ) {
    return Promise.all(
      leadIds.map((leadId) =>
        this.analyzeLead(leadId, { ...options, campaignId }),
      ),
    );
  }

  async analyzeCampaignBatch(
    campaignId: string,
    options: { offset?: number; limit?: number; recalculate?: boolean } = {},
  ) {
    const offset = options.offset ?? 0;
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const [leads, total] = await Promise.all([
      this.dataSource.findLeadsByCampaignId(campaignId, { offset, limit }),
      this.dataSource.countLeadsByCampaignId(campaignId),
    ]);
    const analyses = await this.analyzeLeadIds(
      campaignId,
      leads.map((lead) => lead.id),
      { recalculate: options.recalculate },
    );
    const nextOffset = offset + leads.length;
    return {
      analyses,
      processed: leads.length,
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

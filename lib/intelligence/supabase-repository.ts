import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IntelligenceActivityRepository,
  LeadAnalysisRepository,
  LeadIntelligenceDataSource,
} from "./repositories";
import type {
  LeadAnalysis,
  LeadIntelligenceInput,
  RecommendedService,
} from "./types";

export class SupabaseIntelligenceRepository
  implements
    LeadAnalysisRepository,
    LeadIntelligenceDataSource,
    IntelligenceActivityRepository
{
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  private mapLead(row: Record<string, unknown>): LeadIntelligenceInput {
    return {
      id: String(row.id),
      campaignId: String(row.campaign_id),
      name: String(row.name),
      category: row.category ? String(row.category) : undefined,
      city: [row.city, row.state].filter(Boolean).join(", "),
      website: row.website ? String(row.website) : null,
      phone: row.phone ? String(row.phone) : null,
      address: row.address ? String(row.address) : null,
      rating: row.rating === null ? undefined : Number(row.rating),
      reviews: row.reviews === null ? undefined : Number(row.reviews),
    };
  }

  private mapAnalysis(row: Record<string, unknown>): LeadAnalysis {
    return {
      id: String(row.id),
      leadId: String(row.lead_id),
      campaignId: String(row.campaign_id),
      score: Number(row.score),
      classification: row.classification as LeadAnalysis["classification"],
      priority: row.priority as LeadAnalysis["priority"],
      opportunities: (row.opportunities ?? []) as string[],
      recommendedServices: (row.recommended_services ?? []) as RecommendedService[],
      reasons: (row.reasons ?? []) as string[],
      positiveFactors: (row.positive_factors ?? []) as string[],
      negativeFactors: (row.negative_factors ?? []) as string[],
      missingData: (row.missing_data ?? []) as string[],
      confidence: Number(row.confidence ?? 0),
      rulesVersion: String(row.rules_version),
      analyzedAt: String(row.analyzed_at),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  async campaignExists(id: string) {
    const { data, error } = await this.client
      .from("campaigns")
      .select("id")
      .eq("user_id", this.userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async findLeadById(id: string) {
    const { data, error } = await this.client
      .from("leads")
      .select("*")
      .eq("user_id", this.userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapLead(data) : undefined;
  }

  async findLeadsByCampaignId(
    id: string,
    options: { offset?: number; limit?: number } = {},
  ) {
    let query = this.client
      .from("leads")
      .select("*")
      .eq("user_id", this.userId)
      .eq("campaign_id", id)
      .order("created_at");
    const offset = options.offset ?? 0;
    if (options.limit) query = query.range(offset, offset + options.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => this.mapLead(row));
  }

  async countLeadsByCampaignId(id: string) {
    const { count, error } = await this.client
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", this.userId)
      .eq("campaign_id", id);
    if (error) throw error;
    return count ?? 0;
  }

  async listLeads() {
    const { data, error } = await this.client
      .from("leads")
      .select("*")
      .eq("user_id", this.userId);
    if (error) throw error;
    return (data ?? []).map((row) => this.mapLead(row));
  }

  async findByLeadId(id: string) {
    const { data, error } = await this.client
      .from("lead_analyses")
      .select("*")
      .eq("user_id", this.userId)
      .eq("lead_id", id)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapAnalysis(data) : undefined;
  }

  async findByCampaignId(id: string) {
    const { data, error } = await this.client
      .from("lead_analyses")
      .select("*")
      .eq("user_id", this.userId)
      .eq("campaign_id", id)
      .order("analyzed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => this.mapAnalysis(row));
  }

  async list() {
    const { data, error } = await this.client
      .from("lead_analyses")
      .select("*")
      .eq("user_id", this.userId)
      .order("analyzed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => this.mapAnalysis(row));
  }

  async upsert(value: LeadAnalysis) {
    const row = {
      user_id: this.userId,
      lead_id: value.leadId,
      campaign_id: value.campaignId,
      score: value.score,
      classification: value.classification,
      priority: value.priority,
      opportunities: value.opportunities,
      recommended_services: value.recommendedServices,
      reasons: value.reasons,
      positive_factors: value.positiveFactors,
      negative_factors: value.negativeFactors,
      missing_data: value.missingData,
      confidence: value.confidence,
      rules_version: value.rulesVersion,
      analyzed_at: value.analyzedAt,
      updated_at: value.updatedAt,
    };
    const { data, error } = await this.client
      .from("lead_analyses")
      .upsert(row, { onConflict: "lead_id" })
      .select("*")
      .single();
    if (error) throw error;
    return this.mapAnalysis(data);
  }

  async record(activity: {
    type: "lead_score_calculated" | "lead_analysis_recalculated";
    leadId: string;
    campaignId: string;
    createdAt: string;
  }) {
    const { error } = await this.client.from("crm_activities").insert({
      user_id: this.userId,
      lead_id: activity.leadId,
      campaign_id: activity.campaignId,
      type: activity.type,
      note: "Lead Intelligence",
      created_at: activity.createdAt,
      updated_at: activity.createdAt,
    });
    if (error) throw error;
  }
}

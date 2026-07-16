export type LeadClassification = "Excelente" | "Muito bom" | "Bom" | "Regular" | "Baixo";
export type LeadPriority = "Alta" | "Média" | "Baixa" | "Bloqueada";
export type RecommendationPriority = "Alta" | "Média" | "Baixa";
export type VerificationState = "present" | "absent" | "unknown";
export type LeadIntelligenceInput = {
  id: string; campaignId: string; name: string; category?: string; city?: string;
  state?: string; website?: string | null; websiteStatus?: VerificationState;
  phone?: string | null; hasWhatsapp?: boolean; hasInstagram?: boolean;
  address?: string | null; mapsUrl?: string | null; rating?: number; reviews?: number;
  digitalPresenceLimited?: boolean; hasAutomationSignals?: boolean;
  strategicCategory?: boolean; inCampaignRegion?: boolean; optOut?: boolean; isClient?: boolean;
};
export type RecommendedService = { name: string; reason: string; priority: RecommendationPriority; rule: string };
export type LeadAnalysis = {
  id: string; leadId: string; campaignId: string; score: number;
  classification: LeadClassification; priority: LeadPriority;
  opportunities: string[]; recommendedServices: RecommendedService[];
  reasons: string[]; positiveFactors: string[]; negativeFactors: string[];
  missingData: string[]; confidence: number; rulesVersion: string;
  analyzedAt: string; createdAt: string; updatedAt: string;
};
export type LeadScoringRules = {
  noWebsite: number; noOwnDomain: number; phonePresent: number; whatsappLikely: number;
  completeLocation: number; mapsUrlPresent: number; goodRating: number;
  manyReviewsWithoutSite: number; strategicCategory: number; incompletePresence: number;
  fewReviews: number; approachReady: number; noContactPenalty: number;
  incompleteRecordPenalty: number; outsideRegionPenalty: number; maturePresencePenalty: number;
};
export type RadarFilters = { campaignId?: string; city?: string; category?: string; classification?: LeadClassification; priority?: LeadPriority; minimumScore?: number; withoutWebsite?: boolean; withPhone?: boolean; recommendedService?: string };
export type RadarEntry = { lead: LeadIntelligenceInput; analysis: LeadAnalysis };

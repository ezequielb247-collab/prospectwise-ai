import type { LeadAnalysis, LeadClassification, LeadIntelligenceInput, LeadPriority, LeadScoringRules, RecommendedService } from "./types";

export const RULES_VERSION = "lead-intelligence-v2.0.0";
export const DEFAULT_SCORING_RULES: LeadScoringRules = {
  noWebsite: 20, noOwnDomain: 10, phonePresent: 8, whatsappLikely: 5,
  completeLocation: 5, mapsUrlPresent: 4, goodRating: 4,
  manyReviewsWithoutSite: 10, strategicCategory: 10, incompletePresence: 10,
  fewReviews: 5, approachReady: 8, noContactPenalty: 20,
  incompleteRecordPenalty: 15, outsideRegionPenalty: 15, maturePresencePenalty: 10,
};
export function classifyScore(score: number): LeadClassification { return score >= 85 ? "Excelente" : score >= 70 ? "Muito bom" : score >= 55 ? "Bom" : score >= 40 ? "Regular" : "Baixo"; }
export function prioritizeScore(score: number): LeadPriority { return score >= 70 ? "Alta" : score >= 40 ? "Média" : "Baixa"; }

export class LeadScoringEngine {
  constructor(private readonly rules: LeadScoringRules = DEFAULT_SCORING_RULES) {}
  analyze(lead: LeadIntelligenceInput, now = new Date()): LeadAnalysis {
    let score = 25;
    const positiveFactors: string[] = [], negativeFactors: string[] = [], missingData: string[] = [], opportunities: string[] = [];
    const add = (points: number, reason: string) => { score += points; positiveFactors.push(`${reason} (+${points})`); };
    const subtract = (points: number, reason: string) => { score -= points; negativeFactors.push(`${reason} (-${points})`); };
    const websiteState = lead.websiteStatus ?? (lead.website === null ? "absent" : lead.website ? "present" : "unknown");
    if (websiteState === "absent") { add(this.rules.noWebsite, "Ausência confirmada de site próprio"); opportunities.push("Boa oportunidade para presença digital própria."); }
    else if (websiteState === "unknown") missingData.push("Site não verificado");
    else if (lead.website && !/^https?:\/\/[^/]+\.[a-z]{2,}/i.test(lead.website)) add(this.rules.noOwnDomain, "Site sem domínio próprio identificado");
    if (lead.phone) add(this.rules.phonePresent, "Telefone disponível para contato"); else missingData.push("Telefone");
    if (lead.hasWhatsapp === true) add(this.rules.whatsappLikely, "WhatsApp provável"); else if (lead.hasWhatsapp === undefined) missingData.push("WhatsApp não verificado");
    if (lead.address && lead.city) add(this.rules.completeLocation, "Endereço e cidade completos"); else missingData.push("Localização incompleta");
    if (lead.mapsUrl) add(this.rules.mapsUrlPresent, "Google Maps disponível"); else missingData.push("Google Maps não informado");
    if (lead.rating !== undefined && lead.rating >= 4 && lead.rating <= 4.7) add(this.rules.goodRating, "Boa reputação local"); else if (lead.rating === undefined) missingData.push("Nota não informada");
    if (websiteState === "absent" && (lead.reviews ?? 0) >= 50) add(this.rules.manyReviewsWithoutSite, "Muitas avaliações e ausência de site");
    if (lead.strategicCategory === true) add(this.rules.strategicCategory, "Categoria estratégica");
    if (lead.digitalPresenceLimited === true) add(this.rules.incompletePresence, "Presença digital incompleta");
    if (lead.reviews !== undefined && lead.reviews < 20) add(this.rules.fewReviews, "Poucas avaliações"); else if (lead.reviews === undefined) missingData.push("Avaliações não informadas");
    if (lead.phone && lead.name && lead.category && lead.city) add(this.rules.approachReady, "Dados suficientes para abordagem");
    if (!lead.phone && lead.hasInstagram === false) subtract(this.rules.noContactPenalty, "Nenhum canal de contato disponível");
    if (!lead.name || (!lead.category && !lead.city)) subtract(this.rules.incompleteRecordPenalty, "Registro claramente incompleto");
    if (lead.inCampaignRegion === false) subtract(this.rules.outsideRegionPenalty, "Empresa fora da região da campanha");
    if (websiteState === "present" && lead.digitalPresenceLimited === false && lead.hasAutomationSignals === true) subtract(this.rules.maturePresencePenalty, "Presença digital aparentemente madura");
    const blocked = Boolean(lead.optOut || lead.isClient);
    if (lead.optOut) negativeFactors.push("Lead em opt-out: prospecção bloqueada");
    if (lead.isClient) negativeFactors.push("Cliente convertido: removido da prospecção");
    const normalized = Math.max(0, Math.min(100, score));
    const known = [websiteState !== "unknown", lead.phone !== undefined, Boolean(lead.address || lead.city), lead.rating !== undefined, lead.reviews !== undefined, lead.hasWhatsapp !== undefined];
    const confidence = Math.round((known.filter(Boolean).length / known.length) * 100);
    const timestamp = now.toISOString();
    const recommendedServices = this.recommend(lead, websiteState);
    return { id: `analysis-${lead.id}`, leadId: lead.id, campaignId: lead.campaignId, score: normalized, classification: classifyScore(normalized), priority: blocked ? "Bloqueada" : prioritizeScore(normalized), opportunities, recommendedServices, reasons: [...positiveFactors, ...negativeFactors], positiveFactors, negativeFactors, missingData: [...new Set(missingData)], confidence, rulesVersion: RULES_VERSION, analyzedAt: timestamp, createdAt: timestamp, updatedAt: timestamp };
  }
  private recommend(lead: LeadIntelligenceInput, websiteState: "present" | "absent" | "unknown"): RecommendedService[] {
    const services: RecommendedService[] = [];
    const push = (name: string, reason: string, priority: "Alta" | "Média" | "Baixa", rule: string) => services.push({ name, reason, priority, rule });
    if (websiteState === "absent") { push("Site institucional", "Ausência de site confirmada.", "Alta", "confirmed_no_website"); if (lead.phone) { push("Bot para WhatsApp", "Canal telefônico disponível.", "Média", "phone_channel"); push("Formulário de orçamento", "Facilita a conversão de novos contatos.", "Média", "quote_capture"); } }
    if (websiteState === "present" && lead.digitalPresenceLimited === true) { push("Reformulação de site", "Presença digital marcada como limitada.", "Alta", "limited_existing_site"); push("SEO local", "Há oportunidade de fortalecer descoberta local.", "Média", "local_discovery"); push("Google Business Profile", "Complementa a presença local.", "Média", "local_profile"); }
    if (websiteState === "present" && lead.digitalPresenceLimited === false) { push("Automação de atendimento", "Presença digital madura pode integrar atendimento.", "Média", "mature_automation"); push("CRM comercial", "Organiza oportunidades captadas nos canais existentes.", "Média", "mature_crm"); push("Automação de follow-up", "Acompanha contatos sem envio automático nesta versão.", "Baixa", "mature_follow_up"); }
    if (websiteState === "unknown" && lead.phone) push("Landing page", "Sugestão condicionada à verificação da presença digital.", "Baixa", "unverified_presence");
    return services;
  }
}

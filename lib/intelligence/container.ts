import {LeadScoringEngine} from "./lead-scoring-engine";
import {LeadIntelligenceService} from "./lead-intelligence-service";
import {MockLeadIntelligenceDataSource} from "./mock-intelligence-data-source";
import {InMemoryIntelligenceActivityRepository,InMemoryLeadAnalysisRepository} from "./repositories";
import {queryRadar} from "./radar";
import type {RadarFilters} from "./types";
export const intelligenceDataSource=new MockLeadIntelligenceDataSource();
export const intelligenceAnalyses=new InMemoryLeadAnalysisRepository();
export const intelligenceActivities=new InMemoryIntelligenceActivityRepository();
export const leadIntelligenceService=new LeadIntelligenceService(intelligenceDataSource,new LeadScoringEngine(),intelligenceAnalyses,intelligenceActivities);
export async function getRadar(filters:RadarFilters={}){const [leads,analyses]=await Promise.all([intelligenceDataSource.listLeads(),intelligenceAnalyses.list()]);const byLead=new Map(analyses.map(analysis=>[analysis.leadId,analysis]));return queryRadar(leads.flatMap(lead=>{const analysis=byLead.get(lead.id);return analysis?[{lead,analysis}]:[]}),filters)}

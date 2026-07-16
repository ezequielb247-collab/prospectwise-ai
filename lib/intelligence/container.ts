import "server-only";
import {LeadScoringEngine} from "./lead-scoring-engine";
import {LeadIntelligenceService} from "./lead-intelligence-service";
import {MockLeadIntelligenceDataSource} from "./mock-intelligence-data-source";
import {InMemoryIntelligenceActivityRepository,InMemoryLeadAnalysisRepository} from "./repositories";
import {SupabaseIntelligenceRepository} from "./supabase-repository";
import {queryRadar} from "./radar";
import type {RadarFilters} from "./types";
import {hasSupabaseConfig} from "../supabase/config";
import {createSupabaseServerClient} from "../supabase/server";
const demoByUser=new Map<string,{data:MockLeadIntelligenceDataSource;analyses:InMemoryLeadAnalysisRepository;activities:InMemoryIntelligenceActivityRepository}>();
export async function intelligenceForUser(userId:string){if(hasSupabaseConfig()){const repository=new SupabaseIntelligenceRepository(await createSupabaseServerClient(),userId);return {service:new LeadIntelligenceService(repository,new LeadScoringEngine(),repository,repository),data:repository,analyses:repository}}let scoped=demoByUser.get(userId);if(!scoped){scoped={data:new MockLeadIntelligenceDataSource(),analyses:new InMemoryLeadAnalysisRepository(),activities:new InMemoryIntelligenceActivityRepository()};demoByUser.set(userId,scoped)}return {service:new LeadIntelligenceService(scoped.data,new LeadScoringEngine(),scoped.analyses,scoped.activities),data:scoped.data,analyses:scoped.analyses}}
export async function getUserRadar(userId:string,filters:RadarFilters={}){const {data,analyses}=await intelligenceForUser(userId);const [leads,records]=await Promise.all([data.listLeads(),analyses.list()]);const byLead=new Map(records.map(analysis=>[analysis.leadId,analysis]));return queryRadar(leads.flatMap(lead=>{const analysis=byLead.get(lead.id);return analysis?[{lead,analysis}]:[]}),filters)}

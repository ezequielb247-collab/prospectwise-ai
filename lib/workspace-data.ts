import "server-only";
import { hasSupabaseConfig } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";
import { MOCK_LEADS } from "./mock-leads";
import { campaignSnapshot, MOCK_CAMPAIGNS, MOCK_EVENTS, MOCK_MESSAGES } from "./mock-campaigns";
import {logDatabaseError} from "./safe-db-log";
import type {CrmStage} from "./crm";
import type {CampaignDetailData,WorkspaceData,WorkspaceLead} from "./workspace-model";
function demoData(): WorkspaceData {
  return {
    leads: MOCK_LEADS,
    campaigns: MOCK_CAMPAIGNS.map((item) => {
      const snapshot = campaignSnapshot(item.id)!;
      return { ...item, createdAt:item.createdAt,lastActivityAt:snapshot.events[0]?.createdAt,metrics: snapshot.metrics };
    }),
    activities:MOCK_EVENTS.map(event=>({id:event.id,type:event.type,note:event.description,createdAt:event.createdAt,leadId:event.leadId,campaignId:event.campaignId})),
    messages:MOCK_MESSAGES.map(message=>({campaignId:message.campaignId,leadId:message.leadId,status:message.status,createdAt:message.createdAt})),
  };
}
export async function getWorkspaceData(userId: string): Promise<WorkspaceData> {
  if (!hasSupabaseConfig()) return demoData();
  const supabase = await createSupabaseServerClient();
  const [
    { data: campaignRows, error: campaignError },
    { data: leadRows, error: leadError },
    { data: messages, error: messageError },
    { data: activityRows, error: activityError },
    { data: analysisRows, error: analysisError },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,name,city,status,services,company_limit,created_at")
      .eq("user_id", userId),
    supabase
      .from("leads")
      .select("id,campaign_id,name,category,city,state,website,phone,crm_stage,rating,reviews,notes,created_at")
      .eq("user_id", userId),
    supabase
      .from("messages")
      .select("campaign_id,lead_id,status,created_at")
      .eq("user_id", userId),
    supabase.from("crm_activities").select("id,campaign_id,lead_id,type,note,created_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(50),
    supabase.from("lead_analyses").select("lead_id,score").eq("user_id",userId),
  ]);
  if(campaignError)logDatabaseError({table:"campaigns",operation:"select dashboard",error:campaignError,authenticated:Boolean(userId)});
  if(leadError)logDatabaseError({table:"leads",operation:"select dashboard",error:leadError,authenticated:Boolean(userId)});
  if(messageError)logDatabaseError({table:"messages",operation:"select dashboard",error:messageError,authenticated:Boolean(userId)});
  if(activityError)logDatabaseError({table:"crm_activities",operation:"select dashboard",error:activityError,authenticated:Boolean(userId)});
  if(analysisError)logDatabaseError({table:"lead_analyses",operation:"select dashboard",error:analysisError,authenticated:Boolean(userId)});
  if (campaignError || leadError || messageError || activityError || analysisError)
    throw campaignError ?? leadError ?? messageError ?? activityError ?? analysisError;
  const scores=new Map((analysisRows??[]).map(item=>[item.lead_id,item.score]));
  const leads: WorkspaceLead[] = (leadRows ?? []).map((lead, index) => ({
    id: lead.id,
    campaignId: lead.campaign_id,
    name: lead.name,
    shortName: lead.name,
    category: lead.category ?? "Sem categoria",
    city: [lead.city, lead.state].filter(Boolean).join(", "),
    score: scores.get(lead.id)??0,
    status: lead.crm_stage as CrmStage,
    site: Boolean(lead.website),
    website:lead.website,
    phone: lead.phone ?? "—",
    state:lead.state??undefined,
    rating:lead.rating===null?null:Number(lead.rating),reviews:lead.reviews,notes:lead.notes,createdAt:lead.created_at,
    initials: lead.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join("")
      .toUpperCase(),
    tone: ["mint", "violet", "amber", "blue", "rose"][index % 5],
    analysis: "Execute a análise para qualificar esta empresa.",
    services: [],
  }));
  return {
    leads,
    campaigns: (campaignRows ?? []).map((campaign) => {
      const campaignLeads = leads.filter(
        (lead) => lead.campaignId === campaign.id,
      );
      const campaignMessages = (messages ?? []).filter(
        (message) => message.campaign_id === campaign.id,
      );
      return {
        id: campaign.id,
        name: campaign.name,
        city: campaign.city,
        status: campaign.status,
        services: Array.isArray(campaign.services) ? campaign.services : [],
        createdAt:campaign.created_at,
        lastActivityAt:(activityRows??[]).find(item=>item.campaign_id===campaign.id)?.created_at,
        metrics: {
          companies: campaignLeads.length,
          messages: campaignMessages.length,
          responses: campaignMessages.filter(
            (message) => ["Respondida","responded"].includes(message.status),
          ).length,
          clients: campaignLeads.filter((lead) => lead.status === "Cliente")
            .length,
          progress: campaign.company_limit
            ? Math.round((campaignLeads.length / campaign.company_limit) * 100)
            : 0,
          interested:campaignLeads.filter(lead=>lead.status==="Interessado").length,
          averageScore:campaignLeads.length?Math.round(campaignLeads.reduce((total,lead)=>total+lead.score,0)/campaignLeads.length):0,
        },
      };
    }),
    activities:(activityRows??[]).map(item=>({id:item.id,type:item.type,note:item.note??"",createdAt:item.created_at,leadId:item.lead_id??undefined,campaignId:item.campaign_id})),
    messages:(messages??[]).map(item=>({campaignId:item.campaign_id,leadId:item.lead_id,status:item.status,createdAt:item.created_at})),
  };
}
export async function getLeadDetail(userId:string,id:string){if(!hasSupabaseConfig()){const lead=MOCK_LEADS.find(item=>item.id===id);if(!lead)return;const campaign=MOCK_CAMPAIGNS.find(item=>item.id===lead.campaignId);const {leadTimeline}=await import("./mock-campaigns");return {lead:lead as WorkspaceLead,campaign:campaign?{id:campaign.id,name:campaign.name}:undefined,timeline:leadTimeline(id)}}const supabase=await createSupabaseServerClient();const {data:lead,error}=await supabase.from("leads").select("*").eq("user_id",userId).eq("id",id).maybeSingle();if(error||!lead)return;const [{data:campaign},{data:activities},{data:analysis}]=await Promise.all([supabase.from("campaigns").select("id,name").eq("user_id",userId).eq("id",lead.campaign_id).maybeSingle(),supabase.from("crm_activities").select("id,type,note,created_at").eq("user_id",userId).eq("lead_id",id).order("created_at",{ascending:false}),supabase.from("lead_analyses").select("score").eq("user_id",userId).eq("lead_id",id).maybeSingle()]);const mapped:WorkspaceLead={id:lead.id,campaignId:lead.campaign_id,name:lead.name,shortName:lead.name,category:lead.category??"Sem categoria",city:[lead.city,lead.state].filter(Boolean).join(", "),score:analysis?.score??0,status:lead.crm_stage,site:Boolean(lead.website),phone:lead.phone??"—",initials:lead.name.split(/\s+/).slice(0,2).map((part:string)=>part[0]).join("").toUpperCase(),tone:"mint",analysis:"",services:[]};return {lead:mapped,campaign:campaign??undefined,timeline:(activities??[]).map(item=>({id:item.id,title:item.type,description:item.note??"",createdAt:item.created_at,leadId:id}))}}

export async function getCampaignDetail(userId:string,id:string):Promise<CampaignDetailData|undefined>{if(!hasSupabaseConfig()){const snapshot=campaignSnapshot(id);return snapshot as unknown as CampaignDetailData|undefined}const supabase=await createSupabaseServerClient();const [{data:campaign},{data:messageRows},{data:activities}]=await Promise.all([supabase.from("campaigns").select("*").eq("user_id",userId).eq("id",id).maybeSingle(),supabase.from("messages").select("lead_id,status").eq("user_id",userId).eq("campaign_id",id),supabase.from("crm_activities").select("id,lead_id,type,note,created_at").eq("user_id",userId).eq("campaign_id",id).order("created_at",{ascending:false})]);if(!campaign)return;const data=await getWorkspaceData(userId);const leads=data.leads.filter(lead=>lead.campaignId===id);const messages=(messageRows??[]).map(item=>({leadId:item.lead_id,status:item.status}));const metrics={companies:leads.length,messages:messages.length,responses:messages.filter(item=>item.status==="Respondida").length,clients:leads.filter(item=>item.status==="Cliente").length,progress:campaign.company_limit?Math.round(leads.length/campaign.company_limit*100):0};return {campaign:{id:campaign.id,name:campaign.name,city:campaign.city,status:campaign.status,services:campaign.services??[],metrics,segment:campaign.segment,goal:campaign.company_limit},leads,messages,events:(activities??[]).map(item=>({id:item.id,title:item.type,description:item.note??"",createdAt:item.created_at,leadId:item.lead_id})),metrics}}

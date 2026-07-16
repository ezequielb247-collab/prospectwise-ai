import { hasSupabaseConfig } from "./supabase/config";
import { createSupabaseServerClient } from "./supabase/server";
import { MOCK_LEADS } from "./mock-leads";
import { campaignSnapshot, MOCK_CAMPAIGNS } from "./mock-campaigns";
import type { CrmStage } from "./crm";
import {logDatabaseError} from "./safe-db-log";
export type WorkspaceLead = {
  id: string;
  campaignId: string;
  name: string;
  shortName: string;
  category: string;
  city: string;
  score: number;
  status: CrmStage;
  site: boolean;
  phone: string;
  initials: string;
  tone: string;
  analysis: string;
  services: string[];
};
export type WorkspaceCampaign = {
  id: string;
  name: string;
  city: string;
  status: string;
  services: string[];
  metrics: {
    companies: number;
    messages: number;
    responses: number;
    clients: number;
    progress: number;
  };
};
export type WorkspaceData = {
  leads: WorkspaceLead[];
  campaigns: WorkspaceCampaign[];
};
export type TimelineEvent={id:string;title:string;description:string;createdAt:string;leadId?:string};
export type CampaignDetailData={campaign:WorkspaceCampaign&{segment:string;goal:number};leads:WorkspaceLead[];messages:{leadId:string;status:string}[];events:TimelineEvent[];metrics:WorkspaceCampaign["metrics"]};
function demoData(): WorkspaceData {
  return {
    leads: MOCK_LEADS,
    campaigns: MOCK_CAMPAIGNS.map((item) => {
      const snapshot = campaignSnapshot(item.id)!;
      return { ...item, metrics: snapshot.metrics };
    }),
  };
}
export async function getWorkspaceData(userId: string): Promise<WorkspaceData> {
  if (!hasSupabaseConfig()) return demoData();
  const supabase = await createSupabaseServerClient();
  const [
    { data: campaignRows, error: campaignError },
    { data: leadRows, error: leadError },
    { data: messages, error: messageError },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,name,city,status,services,company_limit")
      .eq("user_id", userId),
    supabase
      .from("leads")
      .select("id,campaign_id,name,category,city,state,website,phone,crm_stage")
      .eq("user_id", userId),
    supabase
      .from("messages")
      .select("campaign_id,status")
      .eq("user_id", userId),
  ]);
  if(campaignError)logDatabaseError({table:"campaigns",operation:"select dashboard",error:campaignError,authenticated:Boolean(userId)});
  if(leadError)logDatabaseError({table:"leads",operation:"select dashboard",error:leadError,authenticated:Boolean(userId)});
  if(messageError)logDatabaseError({table:"messages",operation:"select dashboard",error:messageError,authenticated:Boolean(userId)});
  if (campaignError || leadError || messageError)
    throw campaignError ?? leadError ?? messageError;
  const leads: WorkspaceLead[] = (leadRows ?? []).map((lead, index) => ({
    id: lead.id,
    campaignId: lead.campaign_id,
    name: lead.name,
    shortName: lead.name,
    category: lead.category ?? "Sem categoria",
    city: [lead.city, lead.state].filter(Boolean).join(", "),
    score: 0,
    status: lead.crm_stage as CrmStage,
    site: Boolean(lead.website),
    phone: lead.phone ?? "—",
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
        metrics: {
          companies: campaignLeads.length,
          messages: campaignMessages.length,
          responses: campaignMessages.filter(
            (message) => message.status === "Respondida",
          ).length,
          clients: campaignLeads.filter((lead) => lead.status === "Cliente")
            .length,
          progress: campaign.company_limit
            ? Math.round((campaignLeads.length / campaign.company_limit) * 100)
            : 0,
        },
      };
    }),
  };
}
export function buildWorkspaceLeadMessage(lead: WorkspaceLead) {
  const siteContext = lead.site
    ? "Vi que vocês já possuem presença digital"
    : "Não encontrei um site nos dados disponíveis";
  return `Olá! ${siteContext} para a ${lead.name}, de ${lead.category.toLowerCase()} em ${lead.city}. Percebi uma oportunidade relacionada a ${(lead.services.length ? lead.services : ["presença digital"]).slice(0, 2).join(" e ").toLowerCase()}. Posso compartilhar uma ideia rápida, sem compromisso?\n\nSe preferir não receber novas mensagens, é só me avisar por aqui.`;
}

export async function getLeadDetail(userId:string,id:string){if(!hasSupabaseConfig()){const lead=MOCK_LEADS.find(item=>item.id===id);if(!lead)return;const campaign=MOCK_CAMPAIGNS.find(item=>item.id===lead.campaignId);const {leadTimeline}=await import("./mock-campaigns");return {lead:lead as WorkspaceLead,campaign:campaign?{id:campaign.id,name:campaign.name}:undefined,timeline:leadTimeline(id)}}const supabase=await createSupabaseServerClient();const {data:lead,error}=await supabase.from("leads").select("*").eq("user_id",userId).eq("id",id).maybeSingle();if(error||!lead)return;const [{data:campaign},{data:activities},{data:analysis}]=await Promise.all([supabase.from("campaigns").select("id,name").eq("user_id",userId).eq("id",lead.campaign_id).maybeSingle(),supabase.from("crm_activities").select("id,type,note,created_at").eq("user_id",userId).eq("lead_id",id).order("created_at",{ascending:false}),supabase.from("lead_analyses").select("score").eq("user_id",userId).eq("lead_id",id).maybeSingle()]);const mapped:WorkspaceLead={id:lead.id,campaignId:lead.campaign_id,name:lead.name,shortName:lead.name,category:lead.category??"Sem categoria",city:[lead.city,lead.state].filter(Boolean).join(", "),score:analysis?.score??0,status:lead.crm_stage,site:Boolean(lead.website),phone:lead.phone??"—",initials:lead.name.split(/\s+/).slice(0,2).map((part:string)=>part[0]).join("").toUpperCase(),tone:"mint",analysis:"",services:[]};return {lead:mapped,campaign:campaign??undefined,timeline:(activities??[]).map(item=>({id:item.id,title:item.type,description:item.note??"",createdAt:item.created_at,leadId:id}))}}

export async function getCampaignDetail(userId:string,id:string):Promise<CampaignDetailData|undefined>{if(!hasSupabaseConfig()){const snapshot=campaignSnapshot(id);return snapshot as unknown as CampaignDetailData|undefined}const supabase=await createSupabaseServerClient();const [{data:campaign},{data:messageRows},{data:activities}]=await Promise.all([supabase.from("campaigns").select("*").eq("user_id",userId).eq("id",id).maybeSingle(),supabase.from("messages").select("lead_id,status").eq("user_id",userId).eq("campaign_id",id),supabase.from("crm_activities").select("id,lead_id,type,note,created_at").eq("user_id",userId).eq("campaign_id",id).order("created_at",{ascending:false})]);if(!campaign)return;const data=await getWorkspaceData(userId);const leads=data.leads.filter(lead=>lead.campaignId===id);const messages=(messageRows??[]).map(item=>({leadId:item.lead_id,status:item.status}));const metrics={companies:leads.length,messages:messages.length,responses:messages.filter(item=>item.status==="Respondida").length,clients:leads.filter(item=>item.status==="Cliente").length,progress:campaign.company_limit?Math.round(leads.length/campaign.company_limit*100):0};return {campaign:{id:campaign.id,name:campaign.name,city:campaign.city,status:campaign.status,services:campaign.services??[],metrics,segment:campaign.segment,goal:campaign.company_limit},leads,messages,events:(activities??[]).map(item=>({id:item.id,title:item.type,description:item.note??"",createdAt:item.created_at,leadId:item.lead_id})),metrics}}

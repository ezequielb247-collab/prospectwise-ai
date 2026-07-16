import type {CrmStage} from "./crm";
export type WorkspaceLead={id:string;campaignId:string;name:string;shortName:string;category:string;city:string;score:number;status:CrmStage;site:boolean;phone:string;initials:string;tone:string;analysis:string;services:string[]};
export type WorkspaceCampaign={id:string;name:string;city:string;status:string;services:string[];metrics:{companies:number;messages:number;responses:number;clients:number;progress:number}};
export type WorkspaceData={leads:WorkspaceLead[];campaigns:WorkspaceCampaign[]};
export type TimelineEvent={id:string;title:string;description:string;createdAt:string;leadId?:string};
export type CampaignDetailData={campaign:WorkspaceCampaign&{segment:string;goal:number};leads:WorkspaceLead[];messages:{leadId:string;status:string}[];events:TimelineEvent[];metrics:WorkspaceCampaign["metrics"]};
export function buildWorkspaceLeadMessage(lead:WorkspaceLead){const siteContext=lead.site?"Vi que vocês já possuem presença digital":"Não encontrei um site nos dados disponíveis";return `Olá! ${siteContext} para a ${lead.name}, de ${lead.category.toLowerCase()} em ${lead.city}. Percebi uma oportunidade relacionada a ${(lead.services.length?lead.services:["presença digital"]).slice(0,2).join(" e ").toLowerCase()}. Posso compartilhar uma ideia rápida, sem compromisso?\n\nSe preferir não receber novas mensagens, é só me avisar por aqui.`}

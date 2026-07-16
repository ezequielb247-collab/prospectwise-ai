import {MOCK_LEADS} from "./mock-leads";
export type CampaignStatus="Ativa"|"Pausada"|"Concluída";
export type MockCampaign={id:string;name:string;city:string;segment:string;status:CampaignStatus;goal:number;services:string[];createdAt:string};
export const MOCK_CAMPAIGNS:MockCampaign[]=[
 {id:"campaign-odontologia-campinas",name:"Clínicas odontológicas",city:"Campinas, SP",segment:"Odontologia",status:"Ativa",goal:100,services:["Criação de site","Bot para WhatsApp"],createdAt:"2026-07-10T09:00:00Z"},
 {id:"campaign-servicos-campinas",name:"Serviços profissionais",city:"Campinas, SP",segment:"Serviços",status:"Ativa",goal:60,services:["Agentes de IA","Automações"],createdAt:"2026-07-11T10:30:00Z"},
 {id:"campaign-comercio-local",name:"Comércio local",city:"Campinas, SP",segment:"Comércio",status:"Pausada",goal:40,services:["Landing page","Criação de site"],createdAt:"2026-07-12T13:00:00Z"},
];
export type MockMessage={id:string;campaignId:string;leadId:string;status:"Preparada"|"Enviada"|"Respondida";createdAt:string};
export const MOCK_MESSAGES:MockMessage[]=[
 {id:"message-sorriso",campaignId:"campaign-odontologia-campinas",leadId:"lead-sorriso-prime",status:"Respondida",createdAt:"2026-07-14T14:30:00Z"},
 {id:"message-helena",campaignId:"campaign-servicos-campinas",leadId:"lead-studio-helena",status:"Respondida",createdAt:"2026-07-14T15:10:00Z"},
 {id:"message-vitta",campaignId:"campaign-servicos-campinas",leadId:"lead-vitta-pilates",status:"Preparada",createdAt:"2026-07-15T09:15:00Z"},
 {id:"message-cafe",campaignId:"campaign-comercio-local",leadId:"lead-cafe-aurora",status:"Enviada",createdAt:"2026-07-15T11:40:00Z"},
];
export type MockEvent={id:string;campaignId:string;leadId?:string;messageId?:string;type:string;title:string;description:string;createdAt:string};
export const MOCK_EVENTS:MockEvent[]=[
 {id:"event-1",campaignId:"campaign-odontologia-campinas",type:"campaign_created",title:"Campanha criada",description:"Segmento e limites comerciais definidos.",createdAt:"2026-07-10T09:00:00Z"},
 {id:"event-2",campaignId:"campaign-odontologia-campinas",leadId:"lead-sorriso-prime",type:"lead_imported",title:"Empresa importada",description:"Sorriso Prime adicionada à campanha.",createdAt:"2026-07-10T09:18:00Z"},
 {id:"event-3",campaignId:"campaign-odontologia-campinas",leadId:"lead-sorriso-prime",messageId:"message-sorriso",type:"message_sent",title:"Mensagem enviada",description:"Contato registrado no histórico.",createdAt:"2026-07-14T14:30:00Z"},
 {id:"event-4",campaignId:"campaign-odontologia-campinas",leadId:"lead-sorriso-prime",messageId:"message-sorriso",type:"reply_received",title:"Resposta recebida",description:"Empresa demonstrou interesse em um site.",createdAt:"2026-07-14T15:02:00Z"},
 {id:"event-5",campaignId:"campaign-servicos-campinas",leadId:"lead-studio-helena",type:"stage_changed",title:"Etapa atualizada",description:"Studio Helena movida para Respondeu.",createdAt:"2026-07-15T16:20:00Z"},
];
export function findCampaignById(id:string){return MOCK_CAMPAIGNS.find(campaign=>campaign.id===id)}
export function campaignSnapshot(campaignId:string){const campaign=findCampaignById(campaignId);if(!campaign)return undefined;const leads=MOCK_LEADS.filter(lead=>lead.campaignId===campaignId);const messages=MOCK_MESSAGES.filter(message=>message.campaignId===campaignId);const events=MOCK_EVENTS.filter(event=>event.campaignId===campaignId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));const responses=messages.filter(message=>message.status==="Respondida").length;const clients=leads.filter(lead=>lead.status==="Cliente").length;return {campaign,leads,messages,events,metrics:{companies:leads.length,messages:messages.length,responses,clients,progress:Math.min(100,Math.round(leads.length/campaign.goal*100))}}}
export function leadTimeline(leadId:string){return MOCK_EVENTS.filter(event=>event.leadId===leadId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}

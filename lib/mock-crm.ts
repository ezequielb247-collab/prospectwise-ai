import {CRM_STAGES,MOCK_LEADS,type CrmStage} from "./mock-leads";
export type CrmState=Record<string,CrmStage>;
export const CRM_STORAGE_KEY="prospectwise.crm.v1";
export function createInitialCrmState():CrmState{return Object.fromEntries(MOCK_LEADS.map(lead=>[lead.id,lead.status]))}
export function moveLead(state:CrmState,leadId:string,stage:CrmStage):CrmState{if(!MOCK_LEADS.some(lead=>lead.id===leadId))return state;if(!CRM_STAGES.includes(stage))return state;return {...state,[leadId]:stage}}
export function serializeCrmState(state:CrmState){return JSON.stringify(state)}
export function parseCrmState(value:string|null):CrmState{if(!value)return createInitialCrmState();try{const parsed=JSON.parse(value) as Record<string,string>;const state:CrmState={};for(const lead of MOCK_LEADS){const saved=parsed[lead.id] as CrmStage;state[lead.id]=CRM_STAGES.includes(saved)?saved:lead.status}return state}catch{return createInitialCrmState()}}

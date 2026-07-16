export type LeadResult={externalId:string;name:string;phone:string;website?:string;address:string;category:string;rating?:number;reviews?:number;mapsUrl?:string};
export interface LeadProvider{search(input:{city:string;state:string;segment:string;limit:number}):Promise<LeadResult[]>}
export class MockLeadProvider implements LeadProvider{async search(input:{city:string;state:string;segment:string;limit:number}){return Array.from({length:Math.min(input.limit,5)},(_,i)=>({externalId:`mock-${input.city}-${i}`,name:["Sorriso Prime","Studio Helena","Café Aurora","Vitta Pilates","Almeida & Reis"][i],phone:`+551999000000${i}`,address:`${input.city}, ${input.state}`,category:input.segment,rating:4.5+i/10,reviews:18+i*7}))}}
export class GooglePlacesLeadProvider implements LeadProvider{async search():Promise<LeadResult[]>{throw new Error("Configure GOOGLE_PLACES_API_KEY antes de ativar o adaptador real.")}}
export type MessageRequest={to:string;body:string;idempotencyKey:string};
export interface WhatsAppProvider{send(input:MessageRequest):Promise<{providerMessageId:string}>}
export class MockWhatsAppProvider implements WhatsAppProvider{async send(input:MessageRequest){return {providerMessageId:`mock-${input.idempotencyKey}`}}}
export class MetaWhatsAppProvider implements WhatsAppProvider{async send():Promise<{providerMessageId:string}>{throw new Error("Envios reais exigem aprovação manual e credenciais da Meta.")}}

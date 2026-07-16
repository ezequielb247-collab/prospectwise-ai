import Workspace from "../Workspace";
export default async function Page({searchParams}:{searchParams:Promise<{leadId?:string}>}){const {leadId}=await searchParams;return <Workspace page="mensagens" initialLeadId={leadId??null}/>}

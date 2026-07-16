import ProtectedWorkspace from "../ProtectedWorkspace";
export default async function Page({searchParams}:{searchParams:Promise<{leadId?:string}>}){const {leadId}=await searchParams;return <ProtectedWorkspace page="mensagens" initialLeadId={leadId??null}/>}

import Link from "next/link";
import CampaignDetail from "../../CampaignDetail";
import {campaignSnapshot} from "../../../lib/mock-campaigns";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const data=campaignSnapshot(id);if(!data)return <main className="form-page"><Link href="/campanhas">← Voltar para campanhas</Link><div className="form-card not-found"><span>?</span><h1>Campanha não encontrada</h1><p>O identificador informado não pertence a uma campanha.</p><Link href="/campanhas" className="primary">Ver campanhas</Link></div></main>;return <CampaignDetail data={data}/>}

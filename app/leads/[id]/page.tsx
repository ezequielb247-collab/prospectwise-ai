import Link from "next/link";
import {getLeadDetail} from "../../../lib/workspace-data";
import {requireCurrentUser} from "../../../lib/auth/session";
import LeadIntelligencePanel from "../../LeadIntelligencePanel";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user=await requireCurrentUser(`/leads/${id}`);
  const detail=await getLeadDetail(user.id,id);
  const lead = detail?.lead;
  if (!lead)
    return (
      <main className="form-page">
        <Link href="/leads">← Voltar para leads</Link>
        <div className="form-card not-found">
          <span>?</span>
          <h1>Lead não encontrado</h1>
          <p>O ID informado não corresponde a nenhuma empresa cadastrada.</p>
          <Link className="primary" href="/leads">
            Ver todos os leads
          </Link>
        </div>
      </main>
    );
  const campaign = detail?.campaign;
  const timeline = detail?.timeline??[];
  return (
    <main className="form-page lead-detail-page">
      <Link href="/leads">← Voltar para leads</Link>
      <div className="lead-detail-layout">
        <div>
          <div className="form-card lead-detail">
            <div className={`company-avatar ${lead.tone}`}>{lead.initials}</div>
            <h1>{lead.name}</h1>
            <p>
              {lead.category} · {lead.city}
            </p>
            {campaign && (
              <Link
                className="campaign-chip"
                href={`/campanhas/${campaign.id}`}
              >
                ◉ {campaign.name}
              </Link>
            )}
            <div className="detail-score">
              <b>{lead.score}</b>
              <span>
                Score anterior
                <br />
                <small>Valor persistido</small>
              </span>
            </div>
            <h3>Presença digital</h3>
            <p>
              {lead.site
                ? "Site encontrado nos dados disponíveis."
                : "Nenhum site identificado nos dados disponíveis."}
            </p>
            <Link
              className="primary full"
              href={`/mensagens?leadId=${lead.id}`}
            >
              Preparar mensagem
            </Link>
          </div>
          <LeadIntelligencePanel leadId={lead.id} />
        </div>
        <article className="panel timeline-panel company-timeline">
          <div className="panel-head">
            <div>
              <h3>Timeline da empresa</h3>
              <p>Histórico comercial cronológico</p>
            </div>
          </div>
          <div className="timeline">
            {timeline.map((event) => (
              <div className="timeline-event" key={event.id}>
                <i />
                <div>
                  <b>{event.title}</b>
                  <p>{event.description}</p>
                  <small>
                    {new Date(event.createdAt).toLocaleString("pt-BR")}
                  </small>
                </div>
              </div>
            ))}
            {!timeline.length && (
              <div className="empty small">
                <h3>Sem eventos</h3>
                <p>As próximas ações aparecerão aqui.</p>
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}

import Link from "next/link";
import { getLeadDetail } from "../../../lib/workspace-data";
import { requireCurrentUser } from "../../../lib/auth/session";
import LeadIntelligencePanel from "../../LeadIntelligencePanel";
import LeadSalesPanel from "../../LeadSalesPanel";
import { salesProduct } from "../../../lib/sales-product/container";
import { messagesForUser } from "../../../lib/messages/container";
import { followUpForUser } from "../../../lib/follow-up/container";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser(`/leads/${id}`);
  const detail = await getLeadDetail(user.id, id);
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
  const timeline = detail?.timeline ?? [];
  const [{ tasks, notes }, messageModule, followModule] = await Promise.all([
    salesProduct(),
    messagesForUser(),
    followUpForUser(),
  ]);
  const [leadTasks, leadNotes, allMessages, allFollowUps] = await Promise.all([
    tasks.list(user.id),
    notes.list(user.id, id),
    messageModule.repo.list(user.id),
    followModule.repo.listFollowUps(user.id),
  ]);
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
              <b>{lead.score ?? "Não analisado"}</b>
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
            <div className="lead-facts">
              <span>
                <b>{lead.phone}</b>
                <small>Telefone</small>
              </span>
              <span>
                <b>{lead.state ?? "—"}</b>
                <small>Estado</small>
              </span>
              <span>
                <b>{lead.status}</b>
                <small>Pipeline</small>
              </span>
              <span>
                <b>{lead.rating ?? "—"}</b>
                <small>Nota</small>
              </span>
              <span>
                <b>{lead.reviews ?? 0}</b>
                <small>Avaliações</small>
              </span>
              <span>
                <b>
                  {lead.priority ?? "Não analisado"}
                </b>
                <small>Prioridade</small>
              </span>
            </div>
            <Link
              className="primary full"
              href={`/mensagens?leadId=${lead.id}`}
            >
              Preparar mensagem
            </Link>
            <Link
              className="secondary full"
              href={`/follow-ups?leadId=${lead.id}`}
            >
              Ver follow-ups
            </Link>
          </div>
          <LeadIntelligencePanel leadId={lead.id} />
          <LeadSalesPanel
            leadId={lead.id}
            initialFavorite={Boolean(lead.favorite)}
            initialNotes={leadNotes}
            initialTasks={leadTasks.filter((item) => item.leadId === id)}
            messageCount={
              allMessages.filter((item) => item.leadId === id).length
            }
            followUpCount={
              allFollowUps.filter((item) => item.leadId === id).length
            }
          />
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

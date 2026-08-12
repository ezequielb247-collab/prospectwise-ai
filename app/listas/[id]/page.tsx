import Link from "next/link";
import { requireCurrentUser } from "../../../lib/auth/session";
import { prospectLists } from "../../../lib/prospect-lists/container";
import { EmptyState, SectionCard, WorkspaceShell } from "../../ui/interface";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser(`/listas/${id}`);
  const list = await (await prospectLists()).get(user.id, id);

  if (!list)
    return (
      <WorkspaceShell page="listas" title="Lista não encontrada" subtitle="A lista solicitada não existe ou não pertence à sua conta.">
        <EmptyState title="Lista não encontrada" action={<Link className="secondary" href="/listas">Voltar para listas</Link>} />
      </WorkspaceShell>
    );

  const items = list.items ?? [];
  const leadIds = items.map((item) => item.leadId);
  const messageHref = leadIds.length
    ? `/mensagens?leadIds=${encodeURIComponent(leadIds.join(","))}`
    : "/mensagens";

  return (
    <WorkspaceShell
      page="listas"
      title={list.name}
      subtitle={list.description ?? "Lista comercial para organizar sua prospecção."}
      actions={<Link className="secondary" href="/listas">← Todas as listas</Link>}
    >
      <SectionCard>
        <div className="panel-head">
          <div>
            <h3>{items.length} {items.length === 1 ? "lead selecionado" : "leads selecionados"}</h3>
            <p>Revise a lista, prepare as mensagens e avance para a prospecção manual.</p>
          </div>
          <div className="actions">
            {leadIds.length > 0 && <Link className="secondary" href={messageHref}>Gerar mensagens do lote</Link>}
            {leadIds.length > 0 && <Link className="primary" href={`/prospeccao?listId=${id}`}>Iniciar prospecção</Link>}
          </div>
        </div>
        {items.length ? (
          <div className="commercial-card-grid">
            {items.map((item) => (
              <article className="company panel" key={item.id}>
                <div>
                  <Link href={`/leads/${item.leadId}`}><b>{item.leadName ?? "Lead"}</b></Link>
                  <small>{item.phone ?? "Sem telefone"} · Score {item.score ?? "não analisado"}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Lista vazia" description="Adicione oportunidades pelo Radar ou pela página de Leads." action={<Link className="primary" href="/radar">Abrir Radar</Link>} />
        )}
      </SectionCard>
    </WorkspaceShell>
  );
}

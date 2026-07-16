import Link from "next/link";
import { requireCurrentUser } from "../../lib/auth/session";
import { proposals } from "../../lib/proposals/container";
import { EmptyState, SectionCard, StatusBadge, WorkspaceShell } from "../ui/interface";

export default async function Page() {
  const user = await requireCurrentUser("/propostas");
  const items = await (await proposals()).list(user.id);
  return <WorkspaceShell page="propostas" title="Propostas comerciais" subtitle="Criação e envio exclusivamente manuais.">
    {items.length ? <div className="commercial-card-grid">{items.map(proposal => <SectionCard key={proposal.id}>
      <div className="panel-head"><div><h3>{proposal.title}</h3><p>{proposal.leadName}</p></div><StatusBadge status={proposal.status} /></div>
      <strong>{proposal.price === null ? "Preço não informado" : proposal.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
      <Link className="secondary" href={`/propostas/${proposal.id}`}>Abrir proposta</Link>
    </SectionCard>)}</div> : <EmptyState title="Nenhuma proposta" description="Abra um lead qualificado para preparar uma proposta." />}
  </WorkspaceShell>;
}

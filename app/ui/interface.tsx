import type { ReactNode } from "react";
import Link from "next/link";

type Children = { children: ReactNode; className?: string };

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return <header className="ui-page-header"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="ui-page-actions">{actions}</div>}</header>;
}

export function SectionCard({ children, className = "" }: Children) {
  return <article className={`panel ui-section-card ${className}`.trim()}>{children}</article>;
}

export function FormGrid({ children, className = "" }: Children) {
  return <div className={`ui-form-grid ${className}`.trim()}>{children}</div>;
}

export function FormField({ id, label, help, required, children }: { id: string; label: string; help?: string; required?: boolean; children: ReactNode }) {
  return <div className="ui-form-field"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}{help && <small id={`${id}-help`}>{help}</small>}</div>;
}

export function ActionBar({ children, className = "" }: Children) {
  return <div className={`ui-action-bar ${className}`.trim()}>{children}</div>;
}

export function FilterBar({ children }: Children) { return <div className="ui-filter-bar">{children}</div>; }
export function BulkActionBar({ children }: Children) { return <section className="ui-bulk-action-bar" aria-label="Ações em massa">{children}</section>; }
export function ModalFooter({ children }: Children) { return <footer className="ui-modal-footer">{children}</footer>; }
export function TableActions({ children }: Children) { return <div className="ui-table-actions">{children}</div>; }
export function MobileCardList({ children }: Children) { return <div className="ui-mobile-card-list">{children}</div>; }

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="empty ui-empty-state"><span aria-hidden="true">◇</span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}

export function StatCard({ value, label }: { value: ReactNode; label: string }) {
  return <div className="ui-stat-card"><strong>{value}</strong><span>{label}</span></div>;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Novo", scheduled: "Agendado", draft: "Rascunho", ready: "Pronta",
  sent_manual: "Enviada manualmente", accepted: "Aceita", rejected: "Recusada",
  expired: "Expirada", cancelled: "Cancelada", active: "Ativa", paused: "Pausada",
  completed: "Concluída", pending: "Pendente", blocked: "Bloqueada", failed: "Falhou",
};
export function statusLabel(status: string) { return STATUS_LABELS[status] ?? status; }
export function StatusBadge({ status, tone = "neutral" }: { status: string; tone?: string }) {
  return <span className={`badge ${tone}`}>{statusLabel(status)}</span>;
}

export function InlineAlert({ tone, children }: { tone: "success" | "warning" | "error" | "info"; children: ReactNode }) {
  return <div className={`ui-alert ${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

const WORKSPACE_NAVIGATION = [
  ["dashboard", "Visão geral"], ["campanhas", "Campanhas"], ["leads", "Leads"],
  ["agenda", "Agenda"], ["radar", "Radar"], ["crm", "CRM"], ["mensagens", "Mensagens"],
  ["follow-ups", "Follow-ups"], ["fila", "Fila"], ["listas", "Listas"],
  ["prospeccao", "Prospecção"], ["propostas", "Propostas"], ["respostas", "Respostas"],
  ["configuracoes", "Configurações"],
] as const;

export function WorkspaceShell({ page, title, subtitle, actions, children }: { page: string; title: string; subtitle: string; actions?: ReactNode; children: ReactNode }) {
  return <div className="app workspace-shell">
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><span className="brand-mark">P</span>ProspectWise <b>AI</b></Link>
      <nav aria-label="Navegação principal">{WORKSPACE_NAVIGATION.map(([href, label]) => <Link key={href} href={`/${href}`} className={page === href ? "active" : ""}><span aria-hidden="true">◇</span>{label}</Link>)}</nav>
    </aside>
    <main>
      <header><div className="search"><span aria-hidden="true">⌕</span><input aria-label="Busca global" placeholder="Buscar leads, campanhas, tarefas..." /></div><div className="header-actions"><Link className="primary compact" href="/campanhas/nova">＋ Nova campanha</Link></div></header>
      <section className="content"><PageHeader title={title} subtitle={subtitle} actions={actions} />{children}</section>
    </main>
  </div>;
}

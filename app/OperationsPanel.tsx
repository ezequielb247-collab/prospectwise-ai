/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { WorkspaceData } from "../lib/workspace-model";
import type { FollowUp, QueueItem } from "../lib/follow-up/types";
export function FollowUpsPanel({ data }: { data: WorkspaceData }) {
  const [items, setItems] = useState<FollowUp[]>([]),
    [campaignId, setCampaignId] = useState(""),
    [leadId, setLeadId] = useState(""),
    [status, setStatus] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    const response = await fetch("/api/follow-ups");
    if (response.ok) setItems(await response.json());
  }
  useEffect(() => {
    void load();
  }, []);
  const leads = data.leads.filter(
      (item) => !campaignId || item.campaignId === campaignId,
    ),
    visible = useMemo(
      () =>
        items
          .filter(
            (item) =>
              (!campaignId || item.campaignId === campaignId) &&
              (!leadId || item.leadId === leadId) &&
              (!status || item.status === status),
          )
          .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
      [items, campaignId, leadId, status],
    );
  async function action(payload: object) {
    const response = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setNotice(response.ok ? "Follow-up atualizado." : result.error);
    if (response.ok) await load();
  }
  async function create() {
    if (!campaignId || !leadId) return;
    const date = window.prompt(
      "Data e hora do follow-up (ISO ou data local):",
      new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16),
    );
    if (date)
      await action({
        action: "create",
        campaignId,
        leadId,
        type: "manual",
        attemptNumber: 1,
        scheduledFor: new Date(date).toISOString(),
      });
  }
  return (
    <OperationsShell active="follow-ups">
      <div className="page-heading">
        <div>
          <h1>Follow-ups</h1>
          <p>Organize contatos futuros sem envio automático.</p>
        </div>
        <button className="primary" onClick={() => void create()}>
          Criar follow-up
        </button>
      </div>
      {notice && <div className="toast">{notice}</div>}
      <div className="panel operation-filters">
        <select
          value={campaignId}
          onChange={(e) => {
            setCampaignId(e.target.value);
            setLeadId("");
          }}
        >
          <option value="">Todas as campanhas</option>
          {data.campaigns.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          <option value="">Todos os leads</option>
          {leads.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {["pending", "due", "completed", "cancelled", "blocked"].map(
            (item) => (
              <option key={item}>{item}</option>
            ),
          )}
        </select>
      </div>
      <OperationTable
        items={visible}
        data={data}
        kind="follow-up"
        action={action}
      />
    </OperationsShell>
  );
}
export function QueuePanel({ data }: { data: WorkspaceData }) {
  const [items, setItems] = useState<QueueItem[]>([]),
    [status, setStatus] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    const response = await fetch("/api/queue");
    if (response.ok) setItems(await response.json());
  }
  useEffect(() => {
    void load();
  }, []);
  async function action(payload: object) {
    const response = await fetch("/api/queue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setNotice(response.ok ? "Fila atualizada." : result.error);
    if (response.ok) await load();
  }
  return (
    <OperationsShell active="fila">
      <div className="queue-banner">
        Fila simulada — nenhuma mensagem será enviada externamente.
      </div>
      <div className="page-heading">
        <div>
          <h1>Fila controlada</h1>
          <p>Agendamentos organizacionais para processamento manual.</p>
        </div>
        <Link className="primary" href="/mensagens">
          Agendar mensagem aprovada
        </Link>
      </div>
      {notice && <div className="toast">{notice}</div>}
      <div className="panel operation-filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {[
            "scheduled",
            "ready",
            "completed",
            "failed",
            "blocked",
            "cancelled",
          ].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <OperationTable
        items={items.filter((item) => !status || item.status === status)}
        data={data}
        kind="queue"
        action={action}
      />
    </OperationsShell>
  );
}
function OperationsShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">P</span>ProspectWise <b>AI</b>
        </Link>
        <nav>
          <Link href="/dashboard">▦ Visão geral</Link>
          <Link
            className={active === "follow-ups" ? "active" : ""}
            href="/follow-ups"
          >
            ◷ Follow-ups
          </Link>
          <Link className={active === "fila" ? "active" : ""} href="/fila">
            ≡ Fila
          </Link>
          <Link href="/mensagens">✉ Mensagens</Link>
          <Link href="/crm">▥ CRM</Link>
        </nav>
      </aside>
      <main>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
function OperationTable({
  items,
  data,
  kind,
  action,
}: {
  items: Array<FollowUp | QueueItem>;
  data: WorkspaceData;
  kind: "follow-up" | "queue";
  action: (payload: object) => Promise<void>;
}) {
  const leads = new Map(data.leads.map((item) => [item.id, item]));
  return (
    <article className="panel leads-panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Status</th>
              <th>Agendado</th>
              <th>Detalhes</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/leads/${item.leadId}`}>
                    {leads.get(item.leadId)?.name ?? item.leadId}
                  </Link>
                </td>
                <td>
                  <span className="badge neutral">{item.status}</span>
                </td>
                <td>{new Date(item.scheduledFor).toLocaleString("pt-BR")}</td>
                <td>
                  {kind === "follow-up"
                    ? `Tentativa ${(item as FollowUp).attemptNumber}`
                    : (item as QueueItem).channel}
                </td>
                <td>
                  <div className="row-actions">
                    {item.status !== "completed" && (
                      <button
                        onClick={() =>
                          void action({ action: "complete", id: item.id })
                        }
                      >
                        Concluir
                      </button>
                    )}
                    <button
                      onClick={() =>
                        void action({
                          action: "cancel",
                          id: item.id,
                          reason: "Cancelado manualmente.",
                        })
                      }
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        const value = window.prompt(
                          "Nova data:",
                          item.scheduledFor.slice(0, 16),
                        );
                        if (value)
                          void action({
                            action: "reschedule",
                            id: item.id,
                            scheduledFor: new Date(value).toISOString(),
                          });
                      }}
                    >
                      Reagendar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!items.length && (
        <div className="empty small">
          <h3>Nenhum registro</h3>
          <p>Os próximos agendamentos aparecerão aqui.</p>
        </div>
      )}
    </article>
  );
}

"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { WorkspaceData } from "../lib/workspace-model";
import type {
  SalesTask,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "../lib/sales-product/types";
export default function AgendaPanel({
  initial,
  data,
}: {
  initial: SalesTask[];
  data: WorkspaceData;
}) {
  const [tasks, setTasks] = useState(initial),
    [campaign, setCampaign] = useState(""),
    [lead, setLead] = useState(""),
    [priority, setPriority] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("date"),
    [notice, setNotice] = useState("");
  const visible = useMemo(
    () =>
      [...tasks]
        .filter(
          (item) =>
            (!campaign || item.campaignId === campaign) &&
            (!lead || item.leadId === lead) &&
            (!priority || item.priority === priority) &&
            (!status || item.status === status),
        )
        .sort((a, b) =>
          sort === "priority"
            ? ["urgente", "alta", "media", "baixa"].indexOf(a.priority) -
              ["urgente", "alta", "media", "baixa"].indexOf(b.priority)
            : sort === "created"
              ? b.createdAt.localeCompare(a.createdAt)
              : a.scheduledFor.localeCompare(b.scheduledFor),
        ),
    [tasks, campaign, lead, priority, status, sort],
  );
  async function action(payload: object) {
    const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
      result = await response.json();
    if (!response.ok) {
      setNotice(result.error);
      return;
    }
    const next = await fetch("/api/tasks");
    setTasks(next.ok ? await next.json() : tasks);
    setNotice("Agenda atualizada.");
  }
  async function create() {
    const leadId = window.prompt("ID do lead:", lead || data.leads[0]?.id);
    if (!leadId) return;
    const title = window.prompt("Título da tarefa:", "Entrar em contato");
    if (!title) return;
    const scheduled = window.prompt(
      "Data e hora:",
      new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    );
    if (!scheduled) return;
    await action({
      action: "create",
      leadId,
      title,
      type: "personalizada" as TaskType,
      priority: "media" as TaskPriority,
      scheduledFor: new Date(scheduled).toISOString(),
    });
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">P</span>ProspectWise <b>AI</b>
        </Link>
        <nav>
          <Link href="/dashboard">▦ Visão geral</Link>
          <Link href="/campanhas">◉ Campanhas</Link>
          <Link href="/leads">♙ Leads</Link>
          <Link className="active" href="/agenda">
            ▣ Agenda
          </Link>
          <Link href="/crm">▥ CRM</Link>
          <Link href="/follow-ups">◷ Follow-ups</Link>
          <Link href="/fila">≡ Fila</Link>
        </nav>
      </aside>
      <main>
        <section className="content">
          <div className="page-heading">
            <div>
              <h1>Agenda comercial</h1>
              <p>Tarefas internas por lead e campanha.</p>
            </div>
            <button className="primary" onClick={() => void create()}>
              Nova tarefa
            </button>
          </div>
          {notice && <div className="toast">{notice}</div>}
          <div className="panel operation-filters">
            <select aria-label="Filtrar por responsável" defaultValue="me">
              <option value="me">Eu</option>
            </select>
            <select
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
            >
              <option value="">Todas as campanhas</option>
              {data.campaigns.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select value={lead} onChange={(e) => setLead(e.target.value)}>
              <option value="">Todos os leads</option>
              {data.leads.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">Prioridades</option>
              {["urgente", "alta", "media", "baixa"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Status</option>
              {["hoje", "pendente", "atrasada", "concluida", "cancelada"].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date">Data</option>
              <option value="priority">Prioridade</option>
              <option value="created">Criação</option>
            </select>
          </div>
          <div className="agenda-groups">
            {(
              ["atrasada", "hoje", "pendente", "concluida"] as TaskStatus[]
            ).map((group) => (
              <article className="panel" key={group}>
                <div className="panel-head">
                  <h3>
                    {
                      (
                        {
                          atrasada: "Atrasadas",
                          hoje: "Hoje",
                          pendente: "Próximos dias",
                          concluida: "Concluídas",
                        } as Record<string, string>
                      )[group]
                    }
                  </h3>
                  <span className="badge neutral">
                    {visible.filter((item) => item.status === group).length}
                  </span>
                </div>
                {visible
                  .filter((item) => item.status === group)
                  .map((item) => (
                    <div className="task-row" key={item.id}>
                      <div>
                        <Link href={`/leads/${item.leadId}`}>
                          <b>{item.title}</b>
                        </Link>
                        <small>
                          {item.leadName} ·{" "}
                          {new Date(item.scheduledFor).toLocaleString("pt-BR")}
                        </small>
                      </div>
                      <span
                        className={`badge ${item.priority === "urgente" ? "warning" : "neutral"}`}
                      >
                        {item.priority}
                      </span>
                      {item.status !== "concluida" && (
                        <button
                          onClick={() =>
                            void action({
                              action: "update",
                              id: item.id,
                              status: "concluida",
                            })
                          }
                        >
                          Concluir
                        </button>
                      )}
                      <button
                        onClick={() =>
                          void action({ action: "delete", id: item.id })
                        }
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                {!visible.some((item) => item.status === group) && (
                  <div className="empty small">
                    <p>Nenhuma tarefa nesta seção.</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CRM_STAGES, type CrmStage } from "../lib/crm";
import { type WorkspaceData, type WorkspaceLead } from "../lib/workspace-model";
import { logoutAction } from "./auth/actions";
import MessageCenter from "./MessageCenter";
import {
  dashboardMetrics,
  exportLeadsCsv,
  filterLeads,
  globalSearch,
  paginate,
  sortLeads,
  type LeadSort,
} from "../lib/workspace-insights";
const navigation = [
  ["dashboard", "▦", "Visão geral"],
  ["campanhas", "◉", "Campanhas"],
  ["leads", "♙", "Leads"],
  ["agenda", "▣", "Agenda"],
  ["radar", "◎", "Radar"],
  ["crm", "▥", "CRM"],
  ["mensagens", "✉", "Mensagens"],
  ["follow-ups", "◷", "Follow-ups"],
  ["fila", "≡", "Fila"],
  ["configuracoes", "⚙", "Configurações"],
];
const subtitles: Record<string, string> = {
  campanhas: "Crie, acompanhe e controle suas buscas.",
  leads: "Empresas qualificadas, sem duplicidades.",
  agenda: "Organize tarefas comerciais e próximos contatos.",
  crm: "Acompanhe cada oportunidade até o fechamento.",
  mensagens: "Revise e aprove cada contato antes do envio.",
  configuracoes: "Preferências, segurança e integrações.",
};

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Company({ lead }: { lead: WorkspaceLead }) {
  return (
    <div className="company">
      <span className={`company-avatar ${lead.tone}`}>{lead.initials}</span>
      <div>
        <b>{lead.name}</b>
        <small>
          {lead.category} · {lead.city}
        </small>
      </div>
    </div>
  );
}

export default function Workspace({
  page,
  initialLeadId = null,
  user,
  data,
}: {
  page: string;
  initialLeadId?: string | null;
  user: { name: string; email: string; demo: boolean };
  data: WorkspaceData;
}) {
  const { leads, campaigns } = data;
  const [dark, setDark] = useState(false);
  const [notice, setNotice] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const globalResults = useMemo(
    () => globalSearch(data, globalQuery),
    [data, globalQuery],
  );
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const title =
    page === "dashboard"
      ? `Olá, ${user.name.split(" ")[0]}!`
      : page === "crm"
        ? "Pipeline comercial"
        : page === "campanhas"
          ? "Campanhas"
          : page === "leads"
            ? "Leads encontrados"
            : page === "mensagens"
              ? "Fila de mensagens"
              : "Configurações";
  return (
    <div className={`app ${dark ? "dark" : ""}`}>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">P</span>ProspectWise <b>AI</b>
        </Link>
        <nav>
          {navigation.map(([href, icon, label]) => (
            <Link
              key={href}
              href={`/${href}`}
              className={page === href ? "active" : ""}
            >
              <span>{icon}</span>
              {label}
              {href === "mensagens" && <em>12</em>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan">
            <span>{user.demo ? "Modo demonstração" : "Conta autenticada"}</span>
            <b>Dados isolados por usuário</b>
            <i>
              <span />
            </i>
            <button
              onClick={() =>
                setNotice("Planos pagos estarão disponíveis em breve.")
              }
            >
              Fazer upgrade
            </button>
          </div>
          <div className="profile">
            <span className="avatar">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <b>{user.name}</b>
              <small>{user.email}</small>
              {!user.demo && (
                <form action={logoutAction}>
                  <button className="details-link">Sair</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div className="search">
            ⌕{" "}
            <input
              id="global-search"
              aria-label="Busca global"
              placeholder="Buscar leads, campanhas, tarefas..."
              value={globalQuery}
              onChange={(event) => setGlobalQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setGlobalQuery("");
              }}
            />
            <kbd>⌘ K</kbd>
            {globalQuery && (
              <div
                className="global-results"
                role="listbox"
                aria-label="Resultados da busca global"
              >
                {globalResults.campaigns.map((item) => (
                  <Link
                    key={item.id}
                    href={`/campanhas/${item.id}`}
                    onClick={() => setGlobalQuery("")}
                  >
                    <b>{item.name}</b>
                    <small>Campanha · {item.city}</small>
                  </Link>
                ))}
                {globalResults.leads.map((item) => (
                  <Link
                    key={item.id}
                    href={`/leads/${item.id}`}
                    onClick={() => setGlobalQuery("")}
                  >
                    <b>{item.name}</b>
                    <small>
                      {item.phone} · {item.city}
                    </small>
                  </Link>
                ))}
                {globalResults.tasks.map((item) => (
                  <Link
                    key={item.id}
                    href="/agenda"
                    onClick={() => setGlobalQuery("")}
                  >
                    <b>{item.title}</b>
                    <small>Tarefa · {item.status}</small>
                  </Link>
                ))}
                {!globalResults.leads.length &&
                  !globalResults.campaigns.length &&
                  !globalResults.tasks.length && <span>Nenhum resultado</span>}
              </div>
            )}
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={() => setDark(!dark)}
              aria-label="Alternar tema"
            >
              {dark ? "☀" : "☾"}
            </button>
            <button className="icon-button" aria-label="Notificações">
              ♢<span className="dot" />
            </button>
            <Link className="primary compact" href="/campanhas/nova">
              ＋ Nova campanha
            </Link>
          </div>
        </header>
        <section className="content">
          <div className="page-heading">
            <div>
              <h1>{title}</h1>
              <p>
                {page === "dashboard"
                  ? "Aqui está o resumo da sua prospecção hoje."
                  : subtitles[page]}
              </p>
            </div>
            {page === "leads" ? (
              <div className="actions">
                <Link href="/leads/importar" className="secondary">
                  Importar CSV
                </Link>
                <Link href="/leads/buscar" className="primary">
                  ⌕ Buscar Empresas
                </Link>
              </div>
            ) : (
              !["dashboard", "configuracoes"].includes(page) && (
                <Link href="/campanhas/nova" className="primary">
                  ＋ Nova campanha
                </Link>
              )
            )}
          </div>
          {notice && (
            <div className="toast">
              ✓ {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}
          {page === "dashboard" && (
            <>
              <Dashboard data={data} />
            </>
          )}{" "}
          {page === "campanhas" && (
            <Campaigns campaigns={campaigns} setNotice={setNotice} />
          )}{" "}
          {page === "leads" && (
            <Leads leads={leads} campaigns={campaigns} setNotice={setNotice} />
          )}{" "}
          {page === "crm" && (
            <CRM leads={leads} data={data} setNotice={setNotice} />
          )}{" "}
          {page === "mensagens" && (
            <Messages
              leads={leads}
              campaigns={campaigns}
              setNotice={setNotice}
            />
          )}{" "}
          {page === "configuracoes" && <Settings setNotice={setNotice} />}{" "}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ data }: { data: WorkspaceData }) {
  const { leads, campaigns, activities } = data;
  const summary = dashboardMetrics(data);
  const metrics = [
    ["Campanhas", summary.campaigns, "◉", "blue"],
    ["Empresas", summary.companies, "♙", "violet"],
    ["Leads ativos", summary.active, "↗", "green"],
    ["Leads favoritos", summary.favorites, "★", "amber"],
    ["Tarefas hoje", summary.tasksToday, "▣", "blue"],
    ["Tarefas atrasadas", summary.tasksOverdue, "!", "amber"],
    ["Tarefas concluídas", summary.tasksCompleted, "✓", "green"],
    ["Interessados", summary.interested, "★", "amber"],
    ["Clientes", summary.clients, "✓", "green"],
    ["Taxa de conversão", `${summary.conversion}%`, "%", "blue"],
    ["Mensagens preparadas", summary.prepared, "✉", "violet"],
    ["Mensagens respondidas", summary.responded, "↩", "amber"],
    ["Mensagens agendadas", summary.scheduled, "◷", "blue"],
  ];
  return (
    <>
      <div className="metrics">
        {metrics.map(([label, value, icon, tone]) => (
          <article className="metric" key={label}>
            <div className={`metric-icon ${tone}`}>{icon}</div>
            <span>{label}</span>
            <h2>{value}</h2>
            <p>Dados atuais da sua operação</p>
          </article>
        ))}
      </div>
      <div className="grid-two">
        <article className="panel performance">
          <div className="panel-head">
            <div>
              <h3>Leads por etapa</h3>
              <p>Distribuição atual do CRM</p>
            </div>
            <Link href="/crm">Abrir CRM →</Link>
          </div>
          <div className="chart">
            <div className="chart-bars">
              {CRM_STAGES.slice(0, 7).map((stage) => {
                const count = leads.filter(
                  (lead) => lead.status === stage,
                ).length;
                const height = leads.length
                  ? Math.max(8, Math.round((count / leads.length) * 100))
                  : 8;
                return (
                  <i
                    key={stage}
                    title={`${stage}: ${count}`}
                    style={{ height: `${height}%` }}
                  >
                    <span style={{ height: "0" }} />
                  </i>
                );
              })}
            </div>
            <div className="days">
              {CRM_STAGES.slice(0, 7).map((stage) => (
                <span key={stage} title={stage}>
                  {stage.slice(0, 4)}
                </span>
              ))}
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="sent" />
              Quantidade de leads
            </span>
            <span>
              <i className="replies" />
              Etapas do CRM
            </span>
          </div>
        </article>
        <article className="panel campaign-card dashboard-campaigns">
          <div className="panel-head">
            <div>
              <h3>Empresas por campanha</h3>
              <p>Volume distribuído nas campanhas</p>
            </div>
            <button>•••</button>
          </div>
          <div className="campaign-bars">
            {campaigns.map((campaign) => (
              <div key={campaign.id}>
                <span>{campaign.name}</span>
                <i>
                  <b
                    style={{
                      width: `${Math.max(4, campaigns.length ? (campaign.metrics.companies / Math.max(...campaigns.map((item) => item.metrics.companies), 1)) * 100 : 0)}%`,
                    }}
                  />
                </i>
                <strong>{campaign.metrics.companies}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
      <article className="panel leads-panel">
        <div className="panel-head">
          <div>
            <h3>Leads recentes</h3>
            <p>Últimas empresas encontradas</p>
          </div>
          <Link href="/leads">Ver todos →</Link>
        </div>
        <LeadTable rows={leads.slice(0, 4)} />
      </article>
      <article className="panel activity-panel">
        <div className="panel-head">
          <div>
            <h3>Últimas atividades</h3>
            <p>Eventos recentes da operação</p>
          </div>
        </div>
        {activities
          .filter((item) =>
            [
              "lead_imported",
              "crm_moved",
              "stage_changed",
              "lead_scored",
              "message_created",
            ].includes(item.type),
          )
          .slice(0, 8)
          .map((item) => (
            <div className="activity-row" key={item.id}>
              <span>●</span>
              <div>
                <b>
                  {(
                    {
                      lead_imported: "Empresa importada",
                      crm_moved: "Lead movido",
                      stage_changed: "Lead movido",
                      lead_scored: "Lead analisado",
                      message_created: "Mensagem criada",
                    } as Record<string, string>
                  )[item.type] ?? item.type}
                </b>
                <small>{item.note}</small>
              </div>
              <time>{new Date(item.createdAt).toLocaleString("pt-BR")}</time>
            </div>
          ))}
        {!activities.length && (
          <div className="empty small">
            <p>As próximas ações aparecerão aqui.</p>
          </div>
        )}
      </article>
    </>
  );
}

function Campaigns({
  campaigns,
  setNotice,
}: {
  campaigns: WorkspaceData["campaigns"];
  setNotice: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(campaigns);
  const visibleCampaigns = rows.filter((item) =>
    `${item.name} ${item.city}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR")),
  );
  async function duplicate(id: string) {
    const response = await fetch(`/api/campaigns/${id}/duplicate`, {
      method: "POST",
    });
    if (response.ok) {
      setNotice("Campanha duplicada com sucesso.");
      window.location.reload();
    } else setNotice("Não foi possível duplicar a campanha.");
  }
  async function changeStatus(id: string, current: string) {
    const status = current === "paused" ? "active" : "paused";
    const previous = rows;
    setRows((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    try {
      const response = await fetch(`/api/campaigns/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Falha ao atualizar campanha.");
      setNotice(
        status === "paused" ? "Campanha pausada." : "Campanha retomada.",
      );
    } catch (error) {
      setRows(previous);
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a campanha.",
      );
    }
  }
  return (
    <div className="cards-list">
      <div className="search list-search">
        ⌕{" "}
        <input
          aria-label="Filtrar campanhas"
          placeholder="Filtrar campanhas..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {visibleCampaigns.map((campaign) => {
        const statusLabel =
          (
            {
              active: "Ativa",
              paused: "Pausada",
              draft: "Rascunho",
              completed: "Concluída",
              archived: "Arquivada",
            } as Record<string, string>
          )[campaign.status] ?? campaign.status;
        return (
          <article className="panel campaign-wide" key={campaign.id}>
            <div>
              <Badge
                tone={campaign.status === "active" ? "success" : "warning"}
              >
                ● {statusLabel}
              </Badge>
              <h3>
                {campaign.name} — {campaign.city}
              </h3>
              <p>{campaign.services.join(" · ")}</p>
            </div>
            <div className="campaign-numbers">
              <span>
                <b>{campaign.metrics.companies}</b> empresas
              </span>
              <span>
                <b>{campaign.metrics.messages}</b> mensagens
              </span>
              <span>
                <b>{campaign.metrics.responses}</b> respostas
              </span>
              <span>
                <b>{campaign.metrics.clients}</b> clientes
              </span>
              <span>
                <b>{campaign.metrics.interested ?? 0}</b> interessados
              </span>
              <span>
                <b>{campaign.metrics.averageScore ?? 0}</b> score médio
              </span>
              <span>
                <b>
                  {campaign.lastActivityAt
                    ? new Date(campaign.lastActivityAt).toLocaleDateString(
                        "pt-BR",
                      )
                    : "—"}
                </b>{" "}
                última atividade
              </span>
            </div>
            <div className="campaign-actions">
              <Link className="primary" href={`/campanhas/${campaign.id}`}>
                Ver detalhes
              </Link>
              {["active", "paused", "draft"].includes(campaign.status) && (
                <button
                  className="secondary"
                  onClick={() =>
                    void changeStatus(campaign.id, campaign.status)
                  }
                >
                  {campaign.status === "paused" ? "Retomar" : "Pausar"}
                </button>
              )}
              <button
                className="secondary"
                onClick={() => void duplicate(campaign.id)}
              >
                Duplicar
              </button>
            </div>
          </article>
        );
      })}
      <div className="empty">
        <span>＋</span>
        <h3>Crie sua próxima campanha</h3>
        <p>Pesquise empresas por cidade e segmento com limites seguros.</p>
        <Link href="/campanhas/nova" className="primary">
          Criar campanha
        </Link>
      </div>
    </div>
  );
}
function Leads({
  leads,
  campaigns,
  setNotice,
}: {
  leads: WorkspaceLead[];
  campaigns: WorkspaceData["campaigns"];
  setNotice: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [status, setStatus] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [site, setSite] = useState<"all" | "with" | "without">("all");
  const [phone, setPhone] = useState<"all" | "with" | "without">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<LeadSort>("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const cities = useMemo(
    () => [...new Set(leads.map((item) => item.city).filter(Boolean))].sort(),
    [leads],
  );
  const states = useMemo(
    () => [...new Set(leads.map((item) => item.state).filter(Boolean))].sort(),
    [leads],
  );
  const categories = useMemo(
    () =>
      [...new Set(leads.map((item) => item.category).filter(Boolean))].sort(),
    [leads],
  );
  const filtered = useMemo(
    () =>
      sortLeads(
        filterLeads(leads, {
          query,
          city,
          state,
          category,
          campaignId,
          status,
          minScore: minScore ? Number(minScore) : undefined,
          maxScore: maxScore ? Number(maxScore) : undefined,
          site,
          phone,
        }).filter((lead) => !favoritesOnly || lead.favorite),
        sort,
        direction,
      ),
    [
      leads,
      query,
      city,
      state,
      category,
      campaignId,
      status,
      minScore,
      maxScore,
      site,
      phone,
      favoritesOnly,
      sort,
      direction,
    ],
  );
  const paged = useMemo(
    () => paginate(filtered, page, pageSize),
    [filtered, page, pageSize],
  );
  function exportCsv(scope: "filtered" | "all" | "campaign") {
    const selected =
      scope === "all"
        ? leads
        : scope === "campaign"
          ? leads.filter((item) => item.campaignId === campaignId)
          : filtered;
    if (scope === "campaign" && !campaignId) {
      setNotice("Selecione uma campanha para exportar.");
      return;
    }
    const blob = new Blob(["\uFEFF", exportLeadsCsv(selected, campaigns)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prospectwise-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <article className="panel leads-panel">
      <div className="filters lead-filters">
        <div className="search wide">
          ⌕{" "}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nome, telefone, cidade ou categoria..."
            aria-label="Busca rápida de leads"
          />
        </div>
        <label className="favorite-filter">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(event) => setFavoritesOnly(event.target.checked)}
          />{" "}
          Somente favoritos
        </label>
        <select
          aria-label="Filtrar por cidade"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">Todas as cidades</option>
          {cities.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estado"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">Todos os estados</option>
          {states.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por campanha"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
        >
          <option value="">Todas as campanhas</option>
          {campaigns.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por status CRM"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {CRM_STAGES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <input
          aria-label="Score mínimo"
          type="number"
          min="0"
          max="100"
          placeholder="Score mín."
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
        />
        <input
          aria-label="Score máximo"
          type="number"
          min="0"
          max="100"
          placeholder="Score máx."
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
        />
        <select
          aria-label="Filtrar por site"
          value={site}
          onChange={(e) => setSite(e.target.value as typeof site)}
        >
          <option value="all">Todos os sites</option>
          <option value="with">Com site</option>
          <option value="without">Sem site</option>
        </select>
        <select
          aria-label="Filtrar por telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value as typeof phone)}
        >
          <option value="all">Todos os telefones</option>
          <option value="with">Com telefone</option>
          <option value="without">Sem telefone</option>
        </select>
        <select
          aria-label="Ordenar leads"
          value={sort}
          onChange={(e) => setSort(e.target.value as LeadSort)}
        >
          <option value="name">Nome</option>
          <option value="city">Cidade</option>
          <option value="score">Score</option>
          <option value="createdAt">Data de importação</option>
          <option value="reviews">Avaliações</option>
          <option value="rating">Nota</option>
        </select>
        <button
          className="secondary"
          aria-label="Inverter ordenação"
          onClick={() =>
            setDirection((value) => (value === "asc" ? "desc" : "asc"))
          }
        >
          {direction === "asc" ? "↑ Crescente" : "↓ Decrescente"}
        </button>
        <details className="export-menu">
          <summary className="secondary">Exportar CSV</summary>
          <button onClick={() => exportCsv("all")}>Todos</button>
          <button onClick={() => exportCsv("filtered")}>Filtrados</button>
          <button onClick={() => exportCsv("campaign")}>Campanha atual</button>
        </details>
      </div>
      <LeadTable rows={paged.items} editable setNotice={setNotice} />
      <div className="pagination table-pagination">
        <span>{paged.total} registros</span>
        <label>
          Por página{" "}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <button
          disabled={paged.page === 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Anterior
        </button>
        <span>
          Página {paged.page} de {paged.pages}
        </span>
        <button
          disabled={paged.page === paged.pages}
          onClick={() => setPage((value) => value + 1)}
        >
          Próxima
        </button>
      </div>
    </article>
  );
}
function LeadTable({
  rows,
  editable = false,
  setNotice,
}: {
  rows: WorkspaceLead[];
  editable?: boolean;
  setNotice?: (value: string) => void;
}) {
  const [editing, setEditing] = useState<WorkspaceLead>();
  const [hidden, setHidden] = useState<string[]>([]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/leads/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone") || null,
        website: form.get("website") || null,
        city: form.get("city") || null,
        state: form.get("state") || null,
        category: form.get("category") || null,
        notes: form.get("notes") || null,
        status: form.get("status"),
      }),
    });
    if (response.ok) {
      setNotice?.("Lead atualizado e atividade registrada.");
      setEditing(undefined);
      window.location.reload();
    } else setNotice?.("Não foi possível atualizar o lead.");
  }
  async function remove(lead: WorkspaceLead) {
    if (
      !window.confirm(`Excluir ${lead.name}? Esta ação não pode ser desfeita.`)
    )
      return;
    const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (response.ok) {
      setHidden((current) => [...current, lead.id]);
      setNotice?.("Lead excluído; o histórico foi preservado.");
    } else setNotice?.("Não foi possível excluir o lead.");
  }
  const visible = rows.filter((row) => !hidden.includes(row.id));
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Score</th>
            <th>Status</th>
            <th>Presença digital</th>
            <th>Contato</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {visible.map((l) => (
            <tr key={l.id}>
              <td>
                <Company lead={l} />
              </td>
              <td>
                <span className={`score ${l.score > 85 ? "high" : ""}`}>
                  {l.score}
                </span>
              </td>
              <td>
                <Badge
                  tone={
                    l.status === "Interessado"
                      ? "success"
                      : l.status === "Respondeu"
                        ? "info"
                        : l.status === "Contatado"
                          ? "purple"
                          : "neutral"
                  }
                >
                  {l.status}
                </Badge>
              </td>
              <td>
                <span className={l.site ? "site-ok" : "site-missing"}>
                  ● {l.site ? "Site encontrado" : "Sem site"}
                </span>
              </td>
              <td>
                <b className="phone">{l.phone}</b>
              </td>
              <td>
                <Link href={`/leads/${l.id}`} className="details-link">
                  Ver detalhes
                </Link>
                {editable && (
                  <div className="row-actions">
                    <button onClick={() => setEditing(l)}>Editar</button>
                    <button
                      className="danger-link"
                      onClick={() => void remove(l)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!visible.length && (
        <div className="empty small">
          <h3>Nenhum lead encontrado</h3>
          <p>Tente buscar outro nome.</p>
        </div>
      )}
      {editing && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setEditing(undefined)}
        >
          <form
            className="panel lead-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Editar ${editing.name}`}
            onSubmit={save}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-head">
              <div>
                <h3>Editar lead</h3>
                <p>
                  O score é calculado pelas regras e não pode ser alterado
                  manualmente.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Fechar"
                onClick={() => setEditing(undefined)}
              >
                ×
              </button>
            </div>
            <label>
              Nome
              <input name="name" required defaultValue={editing.name} />
            </label>
            <div className="row">
              <label>
                Telefone
                <input
                  name="phone"
                  defaultValue={editing.phone === "—" ? "" : editing.phone}
                />
              </label>
              <label>
                Site
                <input
                  name="website"
                  type="url"
                  defaultValue={editing.website ?? ""}
                />
              </label>
            </div>
            <div className="row">
              <label>
                Cidade
                <input name="city" defaultValue={editing.city.split(",")[0]} />
              </label>
              <label>
                Estado
                <input
                  name="state"
                  maxLength={2}
                  defaultValue={editing.state ?? ""}
                />
              </label>
            </div>
            <label>
              Categoria
              <input name="category" defaultValue={editing.category} />
            </label>
            <label>
              Status CRM
              <select name="status" defaultValue={editing.status}>
                {CRM_STAGES.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
            <label>
              Observações
              <textarea name="notes" defaultValue={editing.notes ?? ""} />
            </label>
            <div className="editor-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(undefined)}
              >
                Cancelar
              </button>
              <button className="primary">Salvar alterações</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function CRM({
  leads,
  data,
  setNotice,
}: {
  leads: WorkspaceLead[];
  data: WorkspaceData;
  setNotice: (value: string) => void;
}) {
  const [state, setState] = useState<Record<string, CrmStage>>(() =>
    Object.fromEntries(leads.map((lead) => [lead.id, lead.status])),
  );
  const [query, setQuery] = useState("");
  const visibleLeads = leads.filter((lead) =>
    `${lead.name} ${lead.city} ${lead.category}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR")),
  );
  function update(id: string, stage: CrmStage) {
    const lead = leads.find((item) => item.id === id);
    if (!lead) return;
    const previous = state[id] ?? lead.status;
    setState((current) => ({ ...current, [id]: stage }));
    void fetch("/api/crm/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id, campaignId: lead.campaignId, stage }),
    })
      .then((response) => {
        if (!response.ok) throw new Error();
      })
      .catch(() => {
        setState((current) => ({ ...current, [id]: previous }));
        setNotice("Não foi possível persistir a etapa; alteração revertida.");
      });
    setNotice(`Lead movido para ${stage}.`);
  }
  function drop(event: React.DragEvent, stage: CrmStage) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/lead-id");
    if (leads.some((lead) => lead.id === id)) update(id, stage);
  }
  return (
    <>
      <div className="search list-search">
        <input
          aria-label="Filtrar CRM"
          placeholder="Filtrar CRM..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="kanban">
        {CRM_STAGES.map((stage, i) => {
          const items = visibleLeads.filter(
            (lead) => (state[lead.id] ?? lead.status) === stage,
          );
          return (
            <section
              className="kanban-col"
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(event, stage)}
            >
              <header>
                <span className={`kanban-dot k${i % 5}`} />
                <b>{stage}</b>
                <em>{items.length}</em>
              </header>
              {items.map((lead) => (
                <article
                  className="lead-card"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/lead-id", lead.id);
                  }}
                  key={lead.id}
                >
                  <Company lead={lead} />
                  <div>
                    <span className="score">{lead.score}</span>
                    <small>{lead.city}</small>
                  </div>
                  <div className="crm-card-meta">
                    <small>
                      {lead.phone} · {lead.category}
                    </small>
                    <small>
                      {data.campaigns.find(
                        (item) => item.id === lead.campaignId,
                      )?.name ?? "Campanha"}
                    </small>
                    <small>
                      Próxima tarefa:{" "}
                      {(data.tasks ?? [])
                        .filter(
                          (item) =>
                            item.leadId === lead.id &&
                            !["concluida", "cancelada"].includes(item.status),
                        )
                        .sort((a, b) =>
                          a.scheduledFor.localeCompare(b.scheduledFor),
                        )[0]?.title ?? "—"}
                    </small>
                    <small>
                      {lead.favorite ? "★ Favorito" : "☆"} ·{" "}
                      {
                        (data.activities ?? []).filter(
                          (item) => item.leadId === lead.id,
                        ).length
                      }{" "}
                      atividades
                    </small>
                  </div>
                  <label className="move-control">
                    Mover para
                    <select
                      aria-label={`Mover ${lead.name} para`}
                      value={state[lead.id] ?? lead.status}
                      onChange={(event) =>
                        update(lead.id, event.target.value as CrmStage)
                      }
                    >
                      {CRM_STAGES.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
function Messages({
  leads,
  campaigns,
  setNotice,
}: {
  leads: WorkspaceLead[];
  campaigns: WorkspaceData["campaigns"];
  setNotice: (v: string) => void;
}) {
  return (
    <MessageCenter
      data={{ leads, campaigns, activities: [], messages: [] }}
      setNotice={setNotice}
    />
  );
  /* Interface anterior removida da execução; mantida temporariamente no histórico do diff.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => leads.find((lead) => lead.id === initialLeadId)?.id ?? null,
  );
  const [approved, setApproved] = useState(false);
  const [query,setQuery]=useState("");const visibleLeads=leads.filter(lead=>`${lead.name} ${lead.city} ${lead.category} ${lead.phone}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));
  const selected = leads.find((lead) => lead.id === selectedId);
  const message = selected ? buildWorkspaceLeadMessage(selected) : "";
  function select(id: string) {
    setSelectedId(id);
    setApproved(false);
  }
  function approve() {
    if (!selected) return;
    void fetch("/api/messages/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: selected.id,
        campaignId: selected.campaignId,
        body: message,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        setApproved(true);
        setNotice("Mensagem vinculada à empresa e campanha.");
      })
      .catch(() => setNotice("Não foi possível persistir a mensagem."));
  }
  return (
    <div className="grid-two messages-grid">
      <article className="panel message-list">
        <div className="panel-head">
          <div>
            <h3>Aguardando aprovação</h3>
            <p>Selecione uma empresa</p>
          </div>
          <Badge tone="warning">Revisão manual</Badge>
        </div>
        <div className="search list-search"><input aria-label="Filtrar mensagens por lead" placeholder="Filtrar empresas..." value={query} onChange={event=>setQuery(event.target.value)}/></div>
        {visibleLeads.map((lead, i) => (
          <button
            className={`message-item ${selectedId === lead.id ? "selected" : ""}`}
            onClick={() => select(lead.id)}
            key={lead.id}
          >
            <span className={`company-avatar ${lead.tone}`}>
              {lead.initials}
            </span>
            <span>
              <b>{lead.name}</b>
              <small>Há {i ? 18 : 4} minutos</small>
            </span>
            <em>›</em>
          </button>
        ))}
      </article>
      {selected ? (
        <article className="panel message-editor">
          <div className="panel-head">
            <div>
              <h3>{selected.name}</h3>
              <p>
                {selected.phone} · {selected.city}
              </p>
            </div>
            <Badge tone="success">Score {selected.score}</Badge>
          </div>
          <div className="lead-context">
            <b>{selected.category}</b>
            <span>
              {selected.site ? "Site encontrado" : "Sem site identificado"}
            </span>
            <p>{selected.analysis}</p>
            <small>Recomendado: {selected.services.join(" · ")}</small>
          </div>
          <label>
            Mensagem personalizada
            <textarea key={selected.id} defaultValue={message} />
          </label>
          <div className="compliance">
            ✓ Inclui opção de descadastro e não contém informações inventadas.
          </div>
          <div className="editor-actions">
            <button
              className="secondary"
              onClick={() => setNotice("Rascunho salvo.")}
            >
              Salvar rascunho
            </button>
            <button className="primary" onClick={approve}>
              {approved ? "✓ Aprovada" : "Aprovar para a fila"}
            </button>
          </div>
        </article>
      ) : (
        <article className="panel select-lead-empty">
          <span>✉</span>
          <h3>Selecione um lead</h3>
          <p>
            Escolha uma empresa ao lado para gerar uma prévia personalizada.
          </p>
        </article>
      )}
    </div>
  ); */
}
function Settings({ setNotice }: { setNotice: (v: string) => void }) {
  const [provider, setProvider] = useState("mock");
  const [limit, setLimit] = useState(10);
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    const task = setTimeout(() => {
      fetch("/api/integrations")
        .then((response) => response.json())
        .then((data) => {
          setProvider(data.provider ?? "mock");
          setLimit(data.searchLimit ?? 10);
          setConfigured(Boolean(data.outscraperConfigured));
        })
        .catch(() => setConfigured(false));
    }, 0);
    return () => clearTimeout(task);
  }, []);
  function save(e: FormEvent) {
    e.preventDefault();
    void fetch("/api/integrations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, searchLimit: limit }),
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        setNotice("Configurações de busca salvas.");
      })
      .catch(() => setNotice("Não foi possível salvar as configurações."));
  }
  return (
    <form className="settings-grid" onSubmit={save}>
      <article className="panel">
        <h3>Limites de envio</h3>
        <p>Controles atuais mantidos sem alteração nesta sprint.</p>
        <label>
          Limite diário
          <input type="number" defaultValue="25" min="1" max="50" />
        </label>
        <label>
          Intervalo mínimo
          <select defaultValue="5">
            <option value="5">5 minutos</option>
            <option value="10">10 minutos</option>
          </select>
        </label>
        <div className="row">
          <label>
            Início
            <input type="time" defaultValue="09:00" />
          </label>
          <label>
            Fim
            <input type="time" defaultValue="18:00" />
          </label>
        </div>
      </article>
      <article className="panel integrations-settings">
        <div className="panel-head">
          <div>
            <h3>Integrações de busca</h3>
            <p>Escolha a origem e o limite de empresas.</p>
          </div>
          <Badge tone={configured ? "success" : "warning"}>
            {configured ? "Chave configurada" : "Chave pendente"}
          </Badge>
        </div>
        <label>
          API Key da Outscraper
          <input
            type="password"
            readOnly
            value={configured ? "••••••••••••" : ""}
            placeholder="Defina OUTSCRAPER_API_KEY em .env.local"
          />
          <small>
            A chave é lida somente no servidor e nunca é salva no navegador.
          </small>
        </label>
        <label>
          Provider ativo
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
          >
            <option value="mock">MockLeadProvider</option>
            <option value="outscraper">OutscraperLeadProvider</option>
          </select>
        </label>
        <label>
          Limite por busca
          <input
            type="number"
            value={limit}
            onChange={(event) =>
              setLimit(Math.max(1, Math.min(100, Number(event.target.value))))
            }
            min="1"
            max="100"
          />
        </label>
        <div className="integration">
          <span>⌕</span>
          <div>
            <b>Busca de empresas</b>
            <small>
              {provider === "mock"
                ? "Dados simulados seguros"
                : "Outscraper Google Maps Search"}
            </small>
          </div>
          <Badge tone={provider === "mock" ? "info" : "success"}>
            {provider === "mock" ? "Simulado" : "Selecionado"}
          </Badge>
        </div>
      </article>
      <button className="primary save">Salvar configurações</button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CRM_STAGES, type CrmStage } from "../lib/crm";
import {
  buildWorkspaceLeadMessage,
  type WorkspaceData,
  type WorkspaceLead,
} from "../lib/workspace-model";
import CampaignMetrics from "./CampaignMetrics";
import {logoutAction} from "./auth/actions";
const navigation = [
  ["dashboard", "▦", "Visão geral"],
  ["campanhas", "◉", "Campanhas"],
  ["leads", "♙", "Leads"],
  ["radar", "◎", "Radar"],
  ["crm", "▥", "CRM"],
  ["mensagens", "✉", "Mensagens"],
  ["configuracoes", "⚙", "Configurações"],
];
const subtitles: Record<string, string> = {
  campanhas: "Crie, acompanhe e controle suas buscas.",
  leads: "Empresas qualificadas, sem duplicidades.",
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
  const [active, setActive] = useState(true);
  const title =
    page === "dashboard"
      ? "Bom dia, Marco!"
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
              {!user.demo&&<form action={logoutAction}><button className="details-link">Sair</button></form>}
            </div>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div className="search">
            ⌕{" "}
            <input
              aria-label="Busca global"
              placeholder="Buscar leads, campanhas..."
            />
            <kbd>⌘ K</kbd>
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
              <Link href="/leads/buscar" className="primary">
                ⌕ Buscar Empresas
              </Link>
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
              <Dashboard
                active={active}
                setActive={setActive}
                setNotice={setNotice}
                leads={leads}
              />
              <CampaignMetrics campaigns={campaigns} />
            </>
          )}{" "}
          {page === "campanhas" && (
            <Campaigns campaigns={campaigns} active={active} setActive={setActive} />
          )}{" "}
          {page === "leads" && <Leads leads={leads} />}{" "}
          {page === "crm" && <CRM leads={leads} setNotice={setNotice} />}{" "}
          {page === "mensagens" && (
            <Messages leads={leads} initialLeadId={initialLeadId} setNotice={setNotice} />
          )}{" "}
          {page === "configuracoes" && <Settings setNotice={setNotice} />}{" "}
        </section>
      </main>
    </div>
  );
}

function Dashboard({
  active,
  setActive,
  setNotice,
  leads,
}: {
  active: boolean;
  setActive: (v: boolean) => void;
  setNotice: (v: string) => void;
  leads: WorkspaceLead[];
}) {
  const metrics = [
    ["Leads encontrados", "248", "+12,5%", "♙", "blue"],
    ["Mensagens preparadas", "64", "+8,2%", "✉", "violet"],
    ["Mensagens enviadas", "39", "+18,4%", "➤", "green"],
    ["Taxa de resposta", "23,1%", "+4,3%", "↩", "amber"],
  ];
  return (
    <>
      <div className="metrics">
        {metrics.map(([label, value, change, icon, tone]) => (
          <article className="metric" key={label}>
            <div className={`metric-icon ${tone}`}>{icon}</div>
            <span>{label}</span>
            <h2>{value}</h2>
            <p>
              <b>↗ {change}</b> vs. últimos 30 dias
            </p>
          </article>
        ))}
      </div>
      <div className="grid-two">
        <article className="panel performance">
          <div className="panel-head">
            <div>
              <h3>Desempenho</h3>
              <p>Resultados dos últimos 7 dias</p>
            </div>
            <select>
              <option>Últimos 7 dias</option>
            </select>
          </div>
          <div className="chart">
            <div className="chart-bars">
              {[32, 48, 41, 72, 61, 88, 80].map((n, i) => (
                <i key={i} style={{ height: `${n}%` }}>
                  <span style={{ height: `${Math.max(12, n / 3)}%` }} />
                </i>
              ))}
            </div>
            <div className="days">
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="sent" />
              Mensagens enviadas
            </span>
            <span>
              <i className="replies" />
              Respostas
            </span>
          </div>
        </article>
        <article className="panel campaign-card">
          <div className="panel-head">
            <div>
              <Badge tone={active ? "success" : "warning"}>
                ● {active ? "Ativa" : "Pausada"}
              </Badge>
              <h3>Clínicas odontológicas</h3>
              <p>Campinas, SP</p>
            </div>
            <button>•••</button>
          </div>
          <div className="progress-row">
            <span>Progresso</span>
            <b>68%</b>
          </div>
          <div className="bar">
            <span />
          </div>
          <div className="campaign-stats">
            <div>
              <span>Leads</span>
              <b>
                68 <small>/ 100</small>
              </b>
            </div>
            <div>
              <span>Enviadas</span>
              <b>42</b>
            </div>
            <div>
              <span>Respostas</span>
              <b>11</b>
            </div>
          </div>
          <div className="next-send">
            <span>◷</span>
            <div>
              <small>Próximo envio</small>
              <b>{active ? "Hoje, 14:30" : "Campanha pausada"}</b>
            </div>
          </div>
          <button
            className="secondary full"
            onClick={() => {
              setActive(!active);
              setNotice(
                active
                  ? "Campanha pausada com segurança."
                  : "Campanha reativada no modo simulado.",
              );
            }}
          >
            {active ? "Ⅱ Pausar campanha" : "▶ Retomar campanha"}
          </button>
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
    </>
  );
}

function Campaigns({
  campaigns,
  active,
  setActive,
}: {
  campaigns: WorkspaceData["campaigns"];
  active: boolean;
  setActive: (v: boolean) => void;
}) {
  return (
    <div className="cards-list">
      {campaigns.map((campaign, index) => {
        const status =
          index === 0 ? (active ? "Ativa" : "Pausada") : campaign.status;
        return (
          <article className="panel campaign-wide" key={campaign.id}>
            <div>
              <Badge tone={status === "Ativa" ? "success" : "warning"}>
                ● {status}
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
            </div>
            <div className="campaign-actions">
              <Link className="primary" href={`/campanhas/${campaign.id}`}>
                Ver detalhes
              </Link>
              {index === 0 && (
                <button
                  className="secondary"
                  onClick={() => setActive(!active)}
                >
                  {active ? "Pausar" : "Retomar"}
                </button>
              )}
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
function Leads({ leads }: { leads: WorkspaceLead[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      leads.filter((l) => l.name.toLowerCase().includes(query.toLowerCase())),
    [query, leads],
  );
  return (
    <article className="panel leads-panel">
      <div className="filters">
        <div className="search wide">
          ⌕{" "}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar empresa..."
          />
        </div>
        <select>
          <option>Todos os status</option>
        </select>
        <select>
          <option>Maior score</option>
        </select>
      </div>
      <LeadTable rows={filtered} />
    </article>
  );
}
function LeadTable({ rows }: { rows: WorkspaceLead[] }) {
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
          {rows.map((l) => (
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty small">
          <h3>Nenhum lead encontrado</h3>
          <p>Tente buscar outro nome.</p>
        </div>
      )}
    </div>
  );
}
function CRM({ leads, setNotice }: { leads: WorkspaceLead[]; setNotice: (value: string) => void }) {
  const [state, setState] = useState<Record<string, CrmStage>>(() => Object.fromEntries(leads.map((lead) => [lead.id, lead.status])));
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
    <div className="kanban">
      {CRM_STAGES.map((stage, i) => {
        const items = leads.filter(
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
  );
}
function Messages({
  leads,
  setNotice,
  initialLeadId,
}: {
  leads: WorkspaceLead[];
  setNotice: (v: string) => void;
  initialLeadId: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    () => leads.find((lead) => lead.id === initialLeadId)?.id ?? null,
  );
  const [approved, setApproved] = useState(false);
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
        {leads.map((lead, i) => (
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
  );
}
function Settings({ setNotice }: { setNotice: (v: string) => void }) {
  const [provider, setProvider] = useState("mock");
  const [limit, setLimit] = useState(10);
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    const task = setTimeout(() => {
      fetch("/api/integrations")
        .then((response) => response.json())
        .then((data) => {setProvider(data.provider ?? "mock");setLimit(data.searchLimit ?? 10);setConfigured(Boolean(data.outscraperConfigured))})
        .catch(() => setConfigured(false));
    }, 0);
    return () => clearTimeout(task);
  }, []);
  function save(e: FormEvent) {
    e.preventDefault();
    void fetch("/api/integrations",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider,searchLimit:limit})}).then(response=>{if(!response.ok)throw new Error();setNotice("Configurações de busca salvas.")}).catch(()=>setNotice("Não foi possível salvar as configurações."));
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

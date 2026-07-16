/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CommercialMessage, Template } from "../lib/messages/types";
import type { WorkspaceData } from "../lib/workspace-model";
const labels: Record<string, string> = {
  draft: "Rascunho",
  prepared: "Preparada",
  approved: "Aprovada",
  cancelled: "Cancelada",
  first_contact: "Primeiro contato",
  follow_up_1: "Follow-up 1",
  follow_up_2: "Follow-up 2",
  portfolio: "Portfólio",
  meeting_invite: "Convite para reunião",
  proposal: "Proposta",
  closing: "Encerramento",
  opt_out_confirmation: "Confirmação de opt-out",
};
const csvCell = (value: unknown) =>
  `"${String(value ?? "")
    .replace(/^([=+\-@])/, "'$1")
    .replace(/"/g, '""')}"`;
export default function MessageCenter({
  data,
  setNotice,
}: {
  data: WorkspaceData;
  setNotice: (value: string) => void;
}) {
  const [messages, setMessages] = useState<CommercialMessage[]>([]),
    [templates, setTemplates] = useState<Template[]>([]),
    [loading, setLoading] = useState(true),
    [campaignId, setCampaignId] = useState(""),
    [leadId, setLeadId] = useState(""),
    [templateId, setTemplateId] = useState(""),
    [body, setBody] = useState(""),
    [warnings, setWarnings] = useState<string[]>([]),
    [selected, setSelected] = useState<CommercialMessage>(),
    [checked, setChecked] = useState<string[]>([]),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [channel, setChannel] = useState(""),
    [type, setType] = useState(""),
    [sort, setSort] = useState("newest");
  async function load() {
    setLoading(true);
    const response = await fetch("/api/messages");
    if (response.ok) {
      const payload = await response.json();
      setMessages(payload.messages);
      setTemplates(payload.templates);
    }
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);
  const campaignLeads = data.leads.filter(
    (lead) => lead.campaignId === campaignId,
  );
  const filtered = useMemo(
    () =>
      messages
        .filter(
          (item) =>
            (!campaignId || item.campaignId === campaignId) &&
            (!leadId || item.leadId === leadId) &&
            (!status || item.status === status) &&
            (!channel || item.channel === channel) &&
            (!type || item.type === type) &&
            (!templateId || item.templateId === templateId) &&
            `${item.leadName} ${item.body}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "oldest"
            ? a.createdAt.localeCompare(b.createdAt)
            : sort === "company"
              ? (a.leadName ?? "").localeCompare(b.leadName ?? "")
              : sort === "status"
                ? a.status.localeCompare(b.status)
                : b.createdAt.localeCompare(a.createdAt),
        ),
    [
      messages,
      campaignId,
      leadId,
      status,
      channel,
      type,
      templateId,
      query,
      sort,
    ],
  );
  async function request(payload: object) {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  }
  async function preview() {
    if (!leadId) {
      setNotice("Selecione um lead para gerar a mensagem.");
      return;
    }
    try {
      const result = await request({
        action: "preview",
        leadId,
        campaignId,
        templateId,
      });
      setBody(result.body);
      setWarnings(result.warnings);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha na prévia.");
    }
  }
  async function create(status: "draft" | "prepared", allowDuplicate = false) {
    if (!leadId) {
      setNotice("Selecione um lead para gerar a mensagem.");
      return;
    }
    try {
      await request({
        action: "create",
        leadId,
        campaignId,
        templateId,
        body,
        status,
        allowDuplicate,
      });
      setNotice(status === "draft" ? "Rascunho salvo." : "Mensagem preparada.");
      await load();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao salvar.";
      if (
        message.includes("Confirme") &&
        window.confirm(`${message} Deseja continuar?`)
      )
        return create(status, true);
      setNotice(message);
    }
  }
  async function bulk() {
    try {
      const result = await request({
        action: "bulk",
        campaignId,
        leadIds: checked,
        templateId,
      });
      setNotice(
        `${result.created.length} mensagens geradas; ${result.skipped.length} ignoradas.`,
      );
      setChecked([]);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha no lote.");
    }
  }
  async function patch(id: string, payload: object) {
    const response = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (response.ok) {
      setSelected(result);
      await load();
    } else setNotice(result.error);
  }
  async function seed() {
    await request({ action: "seed" });
    await load();
  }
  async function editSelected() {
    if (!selected) return;
    if (selected.status === "approved") {
      setNotice("Volte a mensagem para rascunho antes de editar.");
      return;
    }
    const next = window.prompt("Edite o conteúdo da mensagem:", selected.body);
    if (next?.trim()) await patch(selected.id, { action: "edit", body: next });
  }
  function exportCsv() {
    const campaignNames = new Map(
      data.campaigns.map((item) => [item.id, item.name]),
    );
    const leadNames = new Map(data.leads.map((item) => [item.id, item]));
    const rows = filtered.map((item) => {
      const lead = leadNames.get(item.leadId);
      return [
        lead?.name,
        lead?.phone,
        campaignNames.get(item.campaignId),
        item.channel,
        item.type,
        item.status,
        item.body,
        item.createdAt,
      ];
    });
    const csv = [
      [
        "Empresa",
        "Telefone",
        "Campanha",
        "Canal",
        "Tipo",
        "Status",
        "Conteúdo",
        "Criado em",
      ],
      ...rows,
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mensagens-prospectwise.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="message-center">
      <article className="panel message-composer">
        <div className="panel-head">
          <div>
            <h3>Preparar abordagem</h3>
            <p>Templates determinísticos, sem IA e sem envio externo.</p>
          </div>
          <span className="badge warning">
            Prévia — nenhuma mensagem será enviada
          </span>
        </div>
        {!templates.length && !loading ? (
          <div className="empty small">
            <p>Carregue a biblioteca inicial de templates.</p>
            <button className="primary compact" onClick={() => void seed()}>
              Criar templates iniciais
            </button>
          </div>
        ) : (
          <>
            <div className="composer-selects">
              <label>
                Campanha
                <select
                  value={campaignId}
                  onChange={(event) => {
                    setCampaignId(event.target.value);
                    setLeadId("");
                    setChecked([]);
                  }}
                >
                  <option value="">Selecione</option>
                  {data.campaigns.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Lead
                <select
                  value={leadId}
                  onChange={(event) => setLeadId(event.target.value)}
                >
                  <option value="">Selecione um lead</option>
                  {campaignLeads.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Template
                <select
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                >
                  <option value="">Selecione</option>
                  {templates.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              className="secondary"
              disabled={!campaignId || !leadId || !templateId}
              onClick={() => void preview()}
            >
              Gerar prévia
            </button>
            <div className="message-preview">
              <small>Prévia — nenhuma mensagem será enviada</small>
              <textarea
                aria-label="Conteúdo da mensagem"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={
                  leadId
                    ? "Selecione um template e gere a prévia."
                    : "Selecione um lead para gerar a mensagem."
                }
              />
              {warnings.map((item) => (
                <span className="message-warning" key={item}>
                  ⚠ {item}
                </span>
              ))}
            </div>
            <div className="editor-actions">
              <button
                className="secondary"
                disabled={!body}
                onClick={() => void create("draft")}
              >
                Salvar rascunho
              </button>
              <button
                className="primary"
                disabled={!body}
                onClick={() => void create("prepared")}
              >
                Marcar como preparada
              </button>
            </div>
            {campaignId && (
              <details className="bulk-panel">
                <summary>Gerar mensagens em lote</summary>
                <div className="bulk-leads">
                  {campaignLeads.map((lead) => (
                    <label key={lead.id}>
                      <input
                        type="checkbox"
                        checked={checked.includes(lead.id)}
                        onChange={(event) =>
                          setChecked((current) =>
                            event.target.checked
                              ? [...current, lead.id]
                              : current.filter((id) => id !== lead.id),
                          )
                        }
                      />
                      {lead.name} <small>{lead.phone}</small>
                    </label>
                  ))}
                </div>
                <button
                  className="secondary"
                  disabled={!templateId || !checked.length}
                  onClick={() => void bulk()}
                >
                  Gerar {checked.length} rascunhos
                </button>
              </details>
            )}
          </>
        )}
      </article>
      <article className="panel messages-panel">
        <div className="panel-head">
          <div>
            <h3>Painel de mensagens</h3>
            <p>{filtered.length} registros</p>
          </div>
          <button className="secondary compact" onClick={exportCsv}>
            Exportar CSV
          </button>
        </div>
        <div className="message-filters">
          <input
            aria-label="Buscar mensagens"
            placeholder="Buscar empresa ou conteúdo..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos os status</option>
            {["draft", "prepared", "approved", "cancelled"].map((item) => (
              <option value={item} key={item}>
                {labels[item]}
              </option>
            ))}
          </select>
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          >
            <option value="">Todos os canais</option>
            <option>whatsapp</option>
            <option>email</option>
            <option>manual</option>
          </select>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">Todos os tipos</option>
            {templates.map((item) => (
              <option value={item.type} key={item.id}>
                {labels[item.type]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Mais recente</option>
            <option value="oldest">Mais antiga</option>
            <option value="company">Empresa</option>
            <option value="status">Status</option>
          </select>
        </div>
        {loading ? (
          <div className="skeleton message-skeleton" />
        ) : (
          filtered.map((item) => (
            <button
              className="message-row"
              key={item.id}
              onClick={() => setSelected(item)}
            >
              <span>
                <b>{item.leadName ?? "Empresa"}</b>
                <small>
                  {item.campaignName} · {item.channel} · {labels[item.type]}
                </small>
              </span>
              <span
                className={`badge ${item.status === "approved" ? "success" : item.status === "cancelled" ? "warning" : "neutral"}`}
              >
                {labels[item.status] ?? item.status}
              </span>
              <time>
                {new Date(item.createdAt).toLocaleDateString("pt-BR")}
              </time>
            </button>
          ))
        )}
      </article>
      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setSelected(undefined)}
        >
          <article
            className="panel message-detail"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-head">
              <div>
                <h3>{selected.leadName}</h3>
                <p>
                  {selected.campaignName} · versão {selected.version}
                </p>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelected(undefined)}
              >
                ×
              </button>
            </div>
            <p className="message-copy">{selected.body}</p>
            <div className="message-meta">
              <span>Canal: {selected.channel}</span>
              <span>Tipo: {labels[selected.type]}</span>
              <span>Status: {labels[selected.status]}</span>
              <span>
                Criada: {new Date(selected.createdAt).toLocaleString("pt-BR")}
              </span>
              {selected.approvedAt && (
                <span>
                  Aprovada:{" "}
                  {new Date(selected.approvedAt).toLocaleString("pt-BR")}
                </span>
              )}
            </div>
            <h4>Histórico</h4>
            <div className="message-meta">
              <span>
                Criada em {new Date(selected.createdAt).toLocaleString("pt-BR")}
              </span>
              <span>
                Atualizada em{" "}
                {new Date(selected.updatedAt).toLocaleString("pt-BR")}
              </span>
              {selected.approvedAt && (
                <span>
                  Aprovada em{" "}
                  {new Date(selected.approvedAt).toLocaleString("pt-BR")}
                </span>
              )}
            </div>
            {selected.warnings.map((item) => (
              <span className="message-warning" key={item}>
                ⚠ {item}
              </span>
            ))}
            <div className="editor-actions">
              <Link className="secondary" href={`/leads/${selected.leadId}`}>
                Abrir lead
              </Link>
              <Link
                className="secondary"
                href={`/campanhas/${selected.campaignId}`}
              >
                Abrir campanha
              </Link>
              <button
                className="secondary"
                onClick={() => void patch(selected.id, { action: "duplicate" })}
              >
                Duplicar
              </button>
              <button className="secondary" onClick={() => void editSelected()}>
                Editar
              </button>
              {selected.status !== "draft" && (
                <button
                  className="secondary"
                  onClick={() =>
                    void patch(selected.id, {
                      action: "transition",
                      status: "draft",
                    })
                  }
                >
                  Voltar para rascunho
                </button>
              )}
              <button
                className="primary"
                disabled={selected.status === "approved"}
                onClick={() =>
                  void patch(selected.id, {
                    action: "transition",
                    status: "approved",
                  })
                }
              >
                Aprovar
              </button>
              <button
                className="secondary danger-link"
                onClick={() =>
                  void patch(selected.id, {
                    action: "transition",
                    status: "cancelled",
                  })
                }
              >
                Cancelar
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  CommercialMessage,
  Template,
  ValidationIssue,
} from "../lib/messages/types";
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

type DraftState = { body: string; warnings: ValidationIssue[] };

export default function MessageCenter({
  data,
  setNotice,
  initialLeadIds = [],
}: {
  data: WorkspaceData;
  setNotice: (value: string) => void;
  initialLeadIds?: string[];
}) {
  const allowedLeadIds = useMemo(
    () => new Set(data.leads.map((lead) => lead.id)),
    [data.leads],
  );
  const initialIds = useMemo(
    () => [...new Set(initialLeadIds.filter((id) => allowedLeadIds.has(id)))],
    [initialLeadIds, allowedLeadIds],
  );
  const firstInitialLead = data.leads.find((lead) => lead.id === initialIds[0]);

  const [messages, setMessages] = useState<CommercialMessage[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState(firstInitialLead?.campaignId ?? "");
  const [leadId, setLeadId] = useState(firstInitialLead?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [selected, setSelected] = useState<CommercialMessage>();
  const [checked, setChecked] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("newest");
  const [bulkBusy, setBulkBusy] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/messages", { cache: "no-store" });
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
  const batchLeads = data.leads.filter((lead) => checked.includes(lead.id));
  const currentKey = leadId && templateId ? `${leadId}:${templateId}` : "";
  const persistedCurrent = useMemo(
    () =>
      messages
        .filter(
          (item) =>
            item.leadId === leadId &&
            item.templateId === templateId &&
            item.status !== "cancelled",
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0],
    [messages, leadId, templateId],
  );
  const currentDraft: DraftState =
    (currentKey ? drafts[currentKey] : undefined) ??
    (persistedCurrent
      ? { body: persistedCurrent.body, warnings: persistedCurrent.warnings }
      : { body: "", warnings: [] });
  const body = currentDraft.body;
  const warnings = currentDraft.warnings;

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

  function setCurrentDraft(next: DraftState) {
    if (!currentKey) return;
    setDrafts((current) => ({ ...current, [currentKey]: next }));
  }

  function selectLead(nextLeadId: string) {
    const lead = data.leads.find((item) => item.id === nextLeadId);
    if (lead) setCampaignId(lead.campaignId);
    setLeadId(nextLeadId);
  }

  function latestMessageForLead(nextLeadId: string) {
    return messages
      .filter(
        (item) =>
          item.leadId === nextLeadId &&
          (!templateId || item.templateId === templateId),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

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
    if (!templateId) {
      setNotice("Selecione um template para gerar a mensagem.");
      return;
    }
    try {
      const result = await request({
        action: "preview",
        leadId,
        campaignId,
        templateId,
      });
      setCurrentDraft({ body: result.body, warnings: result.warnings });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha na prévia.");
    }
  }

  async function create(nextStatus: "draft" | "prepared", allowDuplicate = false) {
    if (!leadId) {
      setNotice("Selecione um lead para gerar a mensagem.");
      return;
    }
    if (!templateId) {
      setNotice("Selecione um template.");
      return;
    }
    try {
      const created = (await request({
        action: "create",
        leadId,
        campaignId,
        templateId,
        body,
        status: nextStatus,
        allowDuplicate,
      })) as CommercialMessage;
      setCurrentDraft({ body: created.body, warnings: created.warnings });
      setNotice(
        nextStatus === "draft"
          ? `Rascunho de ${created.leadName ?? "empresa"} salvo.`
          : `Mensagem de ${created.leadName ?? "empresa"} preparada.`,
      );
      await load();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao salvar.";
      if (
        message.includes("Confirme") &&
        window.confirm(`${message} Deseja continuar?`)
      )
        return create(nextStatus, true);
      setNotice(message);
    }
  }

  async function bulk() {
    if (!templateId) {
      setNotice("Selecione um template para gerar o lote.");
      return;
    }
    const uniqueLeadIds = [...new Set(checked)].filter((id) => allowedLeadIds.has(id));
    if (!uniqueLeadIds.length) {
      setNotice("Selecione pelo menos um lead para o lote.");
      return;
    }

    setBulkBusy(true);
    try {
      const groups = new Map<string, string[]>();
      for (const id of uniqueLeadIds) {
        const lead = data.leads.find((item) => item.id === id);
        if (!lead) continue;
        groups.set(lead.campaignId, [...(groups.get(lead.campaignId) ?? []), id]);
      }

      let createdCount = 0;
      const skipped: string[] = [];
      for (const [groupCampaignId, leadIds] of groups) {
        const result = await request({
          action: "bulk",
          campaignId: groupCampaignId,
          leadIds,
          templateId,
        });
        createdCount += result.created.length;
        skipped.push(...result.skipped);
      }
      await load();
      setNotice(
        `${createdCount} ${createdCount === 1 ? "rascunho salvo" : "rascunhos salvos"}; ${skipped.length} ${skipped.length === 1 ? "lead ignorado" : "leads ignorados"}.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha no lote.");
    } finally {
      setBulkBusy(false);
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

  async function scheduleSelected() {
    if (!selected || selected.status !== "approved") return;
    const value = window.prompt(
      "Data e hora para a fila:",
      new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    );
    if (!value) return;
    const response = await fetch("/api/queue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "schedule",
        campaignId: selected.campaignId,
        leadId: selected.leadId,
        messageId: selected.id,
        scheduledFor: new Date(value).toISOString(),
      }),
    });
    const result = await response.json();
    if (response.ok)
      setNotice(
        result.preview.reasons.length
          ? `Agendada. ${result.preview.reasons.join(" ")}`
          : "Mensagem agendada na fila simulada.",
      );
    else setNotice(result.error);
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
      {initialIds.length > 0 && (
        <article className="panel bulk-panel" aria-label="Lote vindo do Radar">
          <div className="panel-head">
            <div>
              <h3>Lote de prospecção</h3>
              <p>
                {checked.length} de {initialIds.length} {initialIds.length === 1 ? "lead selecionado" : "leads selecionados"}. Escolha um template e salve todos os rascunhos de uma vez.
              </p>
            </div>
            <span className="badge info">{checked.length} no lote</span>
          </div>
          <div className="bulk-leads">
            {initialIds.map((id, index) => {
              const lead = data.leads.find((item) => item.id === id);
              if (!lead) return null;
              const latest = latestMessageForLead(id);
              return (
                <div className="message-row" key={id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked.includes(id)}
                      onChange={(event) =>
                        setChecked((current) =>
                          event.target.checked
                            ? [...new Set([...current, id])]
                            : current.filter((item) => item !== id),
                        )
                      }
                    />
                    <span>
                      <b>{index + 1}. {lead.name}</b>
                      <small>{lead.phone} · {lead.city}</small>
                    </span>
                  </label>
                  <span className={`badge ${latest?.status === "approved" ? "success" : latest ? "neutral" : "warning"}`}>
                    {latest ? labels[latest.status] ?? latest.status : "Pendente"}
                  </span>
                  <button type="button" className="secondary compact" onClick={() => selectLead(id)}>
                    Revisar
                  </button>
                </div>
              );
            })}
          </div>
          <div className="editor-actions">
            <button
              className="secondary"
              type="button"
              disabled={!checked.length || bulkBusy}
              onClick={() => setChecked([])}
            >
              Limpar seleção
            </button>
            <button
              className="primary"
              type="button"
              disabled={!templateId || !checked.length || bulkBusy}
              onClick={() => void bulk()}
            >
              {bulkBusy ? "Salvando lote…" : `Salvar ${checked.length} ${checked.length === 1 ? "rascunho" : "rascunhos"}`}
            </button>
          </div>
        </article>
      )}

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
                  onChange={(event) => selectLead(event.target.value)}
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
              {body ? "Regenerar prévia" : "Gerar prévia"}
            </button>
            {persistedCurrent && (
              <p className="message-status-line">
                Versão salva: <span className="badge neutral">{labels[persistedCurrent.status] ?? persistedCurrent.status}</span>
              </p>
            )}
            <div className="message-preview">
              <small>Prévia — nenhuma mensagem será enviada</small>
              <textarea
                aria-label="Conteúdo da mensagem"
                value={body}
                onChange={(event) =>
                  setCurrentDraft({ body: event.target.value, warnings })
                }
                placeholder={
                  leadId
                    ? "Selecione um template e gere a prévia."
                    : "Selecione um lead para gerar a mensagem."
                }
              />
              {warnings.map((item) => (
                <span
                  className={
                    item.type === "blocking_error"
                      ? "message-error"
                      : "message-warning"
                  }
                  key={`${item.type}-${item.message}`}
                >
                  {item.type === "blocking_error" ? "✕" : "⚠"} {item.message}
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
              {checked.length > 1 && (
                <button
                  className="secondary"
                  type="button"
                  onClick={() => {
                    const index = checked.indexOf(leadId);
                    const next = checked[(index + 1 + checked.length) % checked.length];
                    if (next) selectLead(next);
                  }}
                >
                  Próximo do lote →
                </button>
              )}
            </div>
            {campaignId && initialIds.length === 0 && (
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
                              ? [...new Set([...current, lead.id])]
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
                  disabled={!templateId || !checked.length || bulkBusy}
                  onClick={() => void bulk()}
                >
                  {bulkBusy ? "Salvando…" : `Gerar ${checked.length} rascunhos`}
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
        ) : filtered.length ? (
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
        ) : (
          <div className="empty small"><p>Nenhuma mensagem encontrada para os filtros atuais.</p></div>
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
                aria-label="Fechar"
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
              <span
                className={
                  item.type === "blocking_error"
                    ? "message-error"
                    : "message-warning"
                }
                key={`${item.type}-${item.message}`}
              >
                {item.type === "blocking_error" ? "✕" : "⚠"} {item.message}
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
              {selected.status === "approved" && <button className="secondary" onClick={() => void scheduleSelected()}>Agendar na fila</button>}
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
                disabled={
                  selected.status === "approved" ||
                  !selected.body.trim() ||
                  selected.warnings.some(
                    (item) => item.type === "blocking_error",
                  )
                }
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

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CommercialMessage } from "../lib/messages/types";
import type { WorkspaceData } from "../lib/workspace-model";
import { ActionBar, EmptyState, FormField, InlineAlert, SectionCard } from "./ui/interface";

export default function ManualProspectingPanel({
  data,
  initialLeadIds = [],
  sourceName = null,
}: {
  data: WorkspaceData;
  initialLeadIds?: string[];
  sourceName?: string | null;
}) {
  const allowed = useMemo(() => new Set(data.leads.map((lead) => lead.id)), [data.leads]);
  const listIds = useMemo(() => [...new Set(initialLeadIds.filter((id) => allowed.has(id)))], [initialLeadIds, allowed]);
  const [index, setIndex] = useState(0);
  const [campaign, setCampaign] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<CommercialMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    fetch("/api/messages", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (response.ok) setMessages(payload.messages ?? []);
      })
      .finally(() => setLoadingMessages(false));
  }, []);

  const sourceLeads = useMemo(
    () =>
      data.leads.filter((item) =>
        listIds.length ? listIds.includes(item.id) : true,
      ),
    [data.leads, listIds],
  );
  const leads = useMemo(
    () =>
      sourceLeads.filter(
        (item) =>
          (!campaign || item.campaignId === campaign) &&
          item.status !== "Opt-out" &&
          item.status !== "Cliente",
      ),
    [sourceLeads, campaign],
  );
  const safeIndex = leads.length ? Math.min(index, leads.length - 1) : 0;
  const lead = leads[safeIndex];
  const latestMessage = useMemo(
    () =>
      lead
        ? messages
            .filter((item) => item.leadId === lead.id && item.status !== "cancelled")
            .sort((a, b) => {
              const rank: Record<string, number> = { approved: 4, prepared: 3, draft: 2 };
              return (rank[b.status] ?? 0) - (rank[a.status] ?? 0) || b.updatedAt.localeCompare(a.updatedAt);
            })[0]
        : undefined,
    [messages, lead],
  );

  useEffect(() => {
    setBody(latestMessage?.body ?? "");
  }, [lead?.id, latestMessage?.id]);

  function next() {
    setIndex((current) => Math.min(current + 1, Math.max(0, leads.length - 1)));
  }
  function previous() {
    setIndex((current) => Math.max(0, current - 1));
  }

  async function prepare() {
    if (!lead) return;
    if (!body.trim()) {
      setNotice("Prepare ou escreva uma mensagem antes de abrir o WhatsApp.");
      return;
    }
    const response = await fetch("/api/prospecting", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "prepare", leadId: lead.id, body }),
    });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    window.open(result.url, "_blank", "noopener,noreferrer");
    setNotice("WhatsApp aberto. Depois de enviar manualmente, registre o resultado abaixo.");
  }

  async function record(result: string) {
    if (!lead) return;
    const response = await fetch("/api/prospecting", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "record",
        leadId: lead.id,
        messageId: latestMessage?.id ?? null,
        result,
      }),
    });
    const payload = await response.json();
    setNotice(
      response.ok
        ? `Contato ${payload.count}/${payload.limit} registrado para ${lead.name}.`
        : payload.error,
    );
    if (response.ok) next();
  }

  return (
    <section className="commercial-workspace">
      <InlineAlert tone="info">
        Nenhuma mensagem será enviada automaticamente. O WhatsApp só abre após sua ação e você registra o resultado manualmente.
      </InlineAlert>
      {sourceName && (
        <InlineAlert tone="success">
          Lista ativa: <strong>{sourceName}</strong> · {listIds.length} {listIds.length === 1 ? "lead" : "leads"}.
        </InlineAlert>
      )}
      <div className="commercial-toolbar">
        <FormField id="prospecting-campaign" label="Campanha">
          <select
            id="prospecting-campaign"
            value={campaign}
            onChange={(event) => {
              setCampaign(event.target.value);
              setIndex(0);
            }}
          >
            <option value="">Todas</option>
            {data.campaigns.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </FormField>
        <span className="badge warning">Limite padrão: 10/dia</span>
      </div>
      {lead ? (
        <SectionCard>
          <div className="panel-head">
            <div>
              <h3>{lead.name}</h3>
              <p>{lead.phone || "Sem telefone"} · {lead.city || "Cidade não informada"}</p>
            </div>
            <span className="badge info">{safeIndex + 1} de {leads.length}</span>
          </div>

          {loadingMessages ? (
            <p>Carregando mensagens salvas…</p>
          ) : latestMessage ? (
            <InlineAlert tone="success">
              Mensagem {latestMessage.status === "approved" ? "aprovada" : latestMessage.status === "prepared" ? "preparada" : "em rascunho"} carregada automaticamente.
            </InlineAlert>
          ) : (
            <InlineAlert tone="warning">
              Este lead ainda não tem mensagem salva. <Link href={`/mensagens?leadId=${lead.id}`}>Preparar mensagem</Link>
            </InlineAlert>
          )}

          <FormField id="prospecting-message" label="Mensagem revisada">
            <textarea
              id="prospecting-message"
              rows={8}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Revise a mensagem antes de copiar ou abrir o WhatsApp."
            />
          </FormField>

          <ActionBar className="commercial-action-wrap">
            <button
              type="button"
              disabled={!body.trim()}
              onClick={() => void navigator.clipboard.writeText(body).then(() => setNotice("Mensagem copiada."))}
            >
              Copiar mensagem
            </button>
            <button type="button" disabled={!body.trim() || !lead.phone} onClick={() => void prepare()}>
              Abrir WhatsApp
            </button>
            <button type="button" onClick={() => void record("contacted")}>Marcar contatado</button>
            <button type="button" onClick={() => void record("responded")}>Respondeu</button>
            <button type="button" onClick={() => void record("interested")}>Interessado</button>
            <button type="button" onClick={() => void record("not_interested")}>Sem interesse</button>
            <button type="button" className="secondary danger-link" onClick={() => void record("opt_out")}>Opt-out</button>
          </ActionBar>

          <ActionBar className="commercial-action-wrap">
            <button className="secondary" type="button" disabled={safeIndex === 0} onClick={previous}>← Anterior</button>
            <button className="secondary" type="button" disabled={safeIndex >= leads.length - 1} onClick={next}>Pular / Próximo →</button>
            <Link className="secondary" href={`/follow-ups?leadId=${lead.id}`}>Criar follow-up</Link>
            <Link className="secondary" href={`/leads/${lead.id}`}>Abrir lead</Link>
          </ActionBar>
        </SectionCard>
      ) : (
        <EmptyState
          title="Nenhum lead disponível"
          description={sourceName ? "Todos os leads desta lista estão bloqueados, concluídos ou não atendem ao filtro atual." : "Ajuste a campanha ou importe novas oportunidades."}
          action={<Link className="primary" href="/radar">Abrir Radar</Link>}
        />
      )}
      {notice && (
        <InlineAlert tone={/registrado|copiada|aberto/i.test(notice) ? "success" : "error"}>
          {notice}
        </InlineAlert>
      )}
    </section>
  );
}

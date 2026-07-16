"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WorkspaceData } from "../lib/workspace-model";
import { ActionBar, EmptyState, FormField, InlineAlert, SectionCard } from "./ui/interface";

export default function ManualProspectingPanel({ data }: { data: WorkspaceData }) {
  const [index, setIndex] = useState(0), [campaign, setCampaign] = useState(""), [body, setBody] = useState(""), [notice, setNotice] = useState("");
  const leads = useMemo(() => data.leads.filter(item => (!campaign || item.campaignId === campaign) && item.status !== "Opt-out" && item.status !== "Cliente"), [data.leads, campaign]), lead = leads[index];
  async function prepare() { if (!lead) return; const response = await fetch("/api/prospecting", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prepare", leadId: lead.id, body }) }); const result = await response.json(); if (!response.ok) return setNotice(result.error); window.open(result.url, "_blank", "noopener,noreferrer"); }
  async function record(result: string) { if (!lead) return; const response = await fetch("/api/prospecting", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "record", leadId: lead.id, result }) }); const payload = await response.json(); setNotice(response.ok ? `Contato ${payload.count}/${payload.limit} registrado.` : payload.error); if (response.ok) setIndex(current => Math.min(current + 1, leads.length - 1)); }
  return <section className="commercial-workspace">
    <InlineAlert tone="info">Nenhuma mensagem será enviada automaticamente.</InlineAlert>
    <div className="commercial-toolbar"><FormField id="prospecting-campaign" label="Campanha"><select id="prospecting-campaign" value={campaign} onChange={event => { setCampaign(event.target.value); setIndex(0); }}><option value="">Todas</option>{data.campaigns.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></FormField><span className="badge warning">Limite padrão: 10/dia</span></div>
    {lead ? <SectionCard><div className="panel-head"><div><h3>{lead.name}</h3><p>{lead.phone} · {lead.city}</p></div><span className="badge info">{index + 1} de {leads.length}</span></div><FormField id="prospecting-message" label="Mensagem revisada"><textarea id="prospecting-message" rows={7} value={body} onChange={event => setBody(event.target.value)} placeholder="Revise a mensagem antes de copiar ou abrir o WhatsApp." /></FormField><ActionBar className="commercial-action-wrap"><button onClick={() => void navigator.clipboard.writeText(body)}>Copiar</button><button onClick={() => void prepare()}>Abrir WhatsApp</button><button onClick={() => void record("contacted")}>Marcar contatado</button><button onClick={() => void record("responded")}>Respondeu</button><button onClick={() => void record("interested")}>Interessado</button><button onClick={() => void record("not_interested")}>Sem interesse</button><button onClick={() => void record("opt_out")}>Opt-out</button><button className="secondary" onClick={() => setIndex(current => Math.min(current + 1, leads.length - 1))}>Pular</button></ActionBar><Link className="secondary" href={`/follow-ups?leadId=${lead.id}`}>Criar follow-up</Link></SectionCard> : <EmptyState title="Nenhum lead disponível" description="Ajuste a campanha ou importe novas oportunidades." />}
    {notice && <InlineAlert tone={notice.includes("registrado") ? "success" : "error"}>{notice}</InlineAlert>}
  </section>;
}

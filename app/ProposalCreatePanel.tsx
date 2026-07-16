"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROPOSAL_TEMPLATES } from "../lib/proposals/types";
import { ActionBar, FormField, FormGrid, InlineAlert, SectionCard } from "./ui/interface";

export default function ProposalCreatePanel({ leadId, campaignId }: { leadId: string; campaignId: string }) {
  const [template, setTemplate] = useState(PROPOSAL_TEMPLATES[0]);
  const [price, setPrice] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function create() {
    if (!price) return setNotice("Informe o investimento.");
    setSaving(true);
    try {
      const response = await fetch("/api/proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", campaignId, leadId, title: `Proposta — ${template}`, summary: "Proposta comercial personalizada.", problemStatement: "Oportunidade identificada nos dados analisados.", solution: template, scope: `Implementação de ${template}.`, deliverables: [template], timelineText: "Prazo a definir com o cliente.", price: Number(price), paymentTerms: "Condições a definir.", validityDate: null, notes: null }) });
      const result = await response.json();
      if (!response.ok) return setNotice(result.error);
      router.push(`/propostas/${result.id}`);
    } finally { setSaving(false); }
  }
  return <SectionCard className="proposal-create-card">
    <header className="ui-section-heading"><div><h3>Criar proposta</h3><p>Prepare uma proposta comercial para este lead.</p></div></header>
    <InlineAlert tone="warning">O sistema não inventa preços.</InlineAlert>
    <FormGrid className="proposal-form-grid">
      <FormField id="proposal-template" label="Modelo" required><select id="proposal-template" value={template} onChange={e => setTemplate(e.target.value as typeof template)}>{PROPOSAL_TEMPLATES.map(item => <option key={item}>{item}</option>)}</select></FormField>
      <FormField id="proposal-price" label="Investimento (R$)" required><input id="proposal-price" type="number" inputMode="decimal" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} /></FormField>
    </FormGrid>
    {notice && <InlineAlert tone="error">{notice}</InlineAlert>}
    <ActionBar className="ui-section-footer"><button className="primary" disabled={saving} onClick={() => void create()}>{saving ? "Preparando…" : "Preparar proposta"}</button></ActionBar>
  </SectionCard>;
}

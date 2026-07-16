"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DigitalPresence } from "../lib/digital-presence/types";
import { ActionBar, FormField, FormGrid, InlineAlert, SectionCard } from "./ui/interface";

const empty = (leadId: string): DigitalPresence => ({ leadId, websiteStatus: "unknown", websiteUrl: null, domain: null, httpsEnabled: null, mobileFriendly: null, contactFormPresent: null, whatsappPresent: null, instagramUrl: null, facebookUrl: null, googleMapsUrl: null, googleRating: null, googleReviews: null, googleBusinessStatus: "unknown", lastCheckedAt: null, source: "manual", confidence: 0 });

export default function DigitalPresencePanel({ leadId, initial }: { leadId: string; initial?: DigitalPresence }) {
  const [value, setValue] = useState(initial ?? empty(leadId));
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/digital-presence`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) });
      const result = await response.json();
      setNotice(response.ok ? "Presença digital atualizada. Reanalise o lead para atualizar o score." : result.error);
      if (response.ok) { setValue(result); router.refresh(); }
    } finally { setSaving(false); }
  }
  return <SectionCard className="digital-presence-card">
    <header className="ui-section-heading"><div><h3>Presença digital</h3><p>Informe apenas dados verificados manualmente.</p></div></header>
    <FormGrid>
      <FormField id="website-status" label="Status do site"><select id="website-status" value={value.websiteStatus} onChange={e => setValue({ ...value, websiteStatus: e.target.value as DigitalPresence["websiteStatus"] })}><option value="unknown">Não verificado</option><option value="present">Possui</option><option value="absent">Não possui</option></select></FormField>
      <FormField id="website-url" label="URL do site"><input id="website-url" type="url" value={value.websiteUrl ?? ""} onChange={e => setValue({ ...value, websiteUrl: e.target.value || null })} /></FormField>
      <FormField id="whatsapp-present" label="WhatsApp"><select id="whatsapp-present" value={value.whatsappPresent === null ? "unknown" : String(value.whatsappPresent)} onChange={e => setValue({ ...value, whatsappPresent: e.target.value === "unknown" ? null : e.target.value === "true" })}><option value="unknown">Não verificado</option><option value="true">Possui</option><option value="false">Não possui</option></select></FormField>
      <FormField id="google-business" label="Google Business"><select id="google-business" value={value.googleBusinessStatus} onChange={e => setValue({ ...value, googleBusinessStatus: e.target.value as DigitalPresence["googleBusinessStatus"] })}><option value="unknown">Não verificado</option><option value="present">Possui</option><option value="absent">Não possui</option></select></FormField>
      <FormField id="instagram-url" label="Instagram"><input id="instagram-url" type="url" value={value.instagramUrl ?? ""} onChange={e => setValue({ ...value, instagramUrl: e.target.value || null })} /></FormField>
      <FormField id="google-maps-url" label="Google Maps"><input id="google-maps-url" type="url" value={value.googleMapsUrl ?? ""} onChange={e => setValue({ ...value, googleMapsUrl: e.target.value || null })} /></FormField>
      <FormField id="presence-confidence" label="Confiança" help="Valor entre 0 e 100."><input id="presence-confidence" type="number" min="0" max="100" value={value.confidence} onChange={e => setValue({ ...value, confidence: Number(e.target.value) })} /></FormField>
    </FormGrid>
    {notice && <InlineAlert tone="info">{notice}</InlineAlert>}
    <ActionBar className="ui-section-footer"><button className="primary" disabled={saving} onClick={() => void save()}>{saving ? "Salvando…" : "Atualizar presença digital"}</button></ActionBar>
  </SectionCard>;
}

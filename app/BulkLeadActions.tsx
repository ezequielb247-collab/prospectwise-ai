"use client";

import { useMemo, useState } from "react";
import type { WorkspaceLead, WorkspaceCampaign } from "../lib/workspace-model";
import { exportLeadsCsv } from "../lib/workspace-insights";
import ProspectListPicker from "./ProspectListPicker";
import { ActionBar, BulkActionBar, InlineAlert } from "./ui/interface";

export default function BulkLeadActions({ leads, campaigns = [], selected: controlledSelected, onSelectionChange }: { leads: WorkspaceLead[]; campaigns?: WorkspaceCampaign[]; selected?: string[]; onSelectionChange?: (ids: string[]) => void }) {
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const selected = controlledSelected ?? localSelected;
  const changeSelection = onSelectionChange ?? setLocalSelected;
  const chosen = useMemo(() => leads.filter(item => selected.includes(item.id)), [leads, selected]);
  const selectedCampaignId = useMemo(() => {
    const ids = [...new Set(chosen.map((lead) => lead.campaignId))];
    return ids.length === 1 ? ids[0] : null;
  }, [chosen]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const post = (url: string, body: object) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  async function favorite() {
    setError("");
    const responses = await Promise.all(selected.map(id => post(`/api/leads/${id}/favorite`, { favorite: true })));
    if (responses.some((response) => !response.ok)) return setError("Não foi possível favoritar todos os leads.");
    setNotice(`${selected.length} ${selected.length === 1 ? "lead favoritado" : "leads favoritados"}.`);
  }
  async function analyze() {
    setError("");
    const responses = await Promise.all(selected.map(id => post(`/api/intelligence/leads/${id}`, { recalculate: true })));
    if (responses.some((response) => !response.ok)) return setError("Alguns leads não puderam ser analisados.");
    setNotice("Análise em lote concluída.");
  }
  async function move() {
    const stage = window.prompt("Mover para etapa:", "Contatado");
    if (!stage) return;
    setError("");
    const responses = await Promise.all(selected.map(leadId => post("/api/crm/move", { leadId, stage })));
    if (responses.some((response) => !response.ok)) return setError("Não foi possível mover todos os leads.");
    setNotice(`Leads movidos para ${stage}.`);
  }
  function download() {
    const blob = new Blob([exportLeadsCsv(chosen, campaigns)], { type: "text/csv" }), url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "leads-selecionados.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${chosen.length} ${chosen.length === 1 ? "lead exportado" : "leads exportados"}.`);
  }

  return <BulkActionBar>
    <div className="bulk-selection-controls">
      <div>{selected.length ? <span className="badge info">{selected.length} {selected.length === 1 ? "selecionado" : "selecionados"}</span> : <p>Selecione leads para executar ações em massa.</p>}</div>
      <ActionBar><button className="secondary" onClick={() => changeSelection(leads.map(item => item.id))}>Selecionar página</button><button className="secondary" onClick={() => changeSelection([])} disabled={!selected.length}>Limpar</button></ActionBar>
    </div>
    {selected.length > 0 && <ActionBar className="bulk-action-buttons"><button onClick={() => void favorite()}>Favoritar</button><button onClick={() => void analyze()}>Analisar</button><button onClick={() => { location.href = `/mensagens?leadIds=${selected.join(",")}`; }}>Criar mensagens</button><button onClick={() => void move()}>Mover etapa</button><ProspectListPicker leadIds={selected} campaignId={selectedCampaignId} onSuccess={(message) => { setNotice(message); setError(""); changeSelection([]); }} /><button onClick={download}>Exportar</button><button className="secondary" onClick={() => changeSelection([])}>Limpar seleção</button></ActionBar>}
    {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
    {error && <InlineAlert tone="error">{error}</InlineAlert>}
  </BulkActionBar>;
}

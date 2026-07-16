"use client";

import { useMemo, useState } from "react";
import type { WorkspaceLead, WorkspaceCampaign } from "../lib/workspace-model";
import { exportLeadsCsv } from "../lib/workspace-insights";
import { ActionBar, BulkActionBar, InlineAlert } from "./ui/interface";

export default function BulkLeadActions({ leads, campaigns = [], selected: controlledSelected, onSelectionChange }: { leads: WorkspaceLead[]; campaigns?: WorkspaceCampaign[]; selected?: string[]; onSelectionChange?: (ids: string[]) => void }) {
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const selected = controlledSelected ?? localSelected;
  const changeSelection = onSelectionChange ?? setLocalSelected;
  const chosen = useMemo(() => leads.filter(item => selected.includes(item.id)), [leads, selected]);
  const [notice, setNotice] = useState("");
  const post = (url: string, body: object) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  async function favorite() { await Promise.all(selected.map(id => post(`/api/leads/${id}/favorite`, { favorite: true }))); setNotice("Leads favoritados."); }
  async function analyze() { await Promise.all(selected.map(id => post(`/api/intelligence/leads/${id}`, { recalculate: true }))); setNotice("Análise em lote concluída."); }
  async function move() { const stage = window.prompt("Mover para etapa:", "Contatado"); if (!stage) return; await Promise.all(selected.map(leadId => post("/api/crm/move", { leadId, stage }))); setNotice("Etapa atualizada."); }
  async function addList() { const id = window.prompt("ID da lista:"); if (id) await post("/api/prospect-lists", { action: "add", id, leadIds: selected }); setNotice("Leads adicionados à lista."); }
  function download() { const blob = new Blob([exportLeadsCsv(chosen, campaigns)], { type: "text/csv" }), url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = "leads-selecionados.csv"; anchor.click(); URL.revokeObjectURL(url); }
  return <BulkActionBar>
    <div className="bulk-selection-controls">
      <div>{selected.length ? <span className="badge info">{selected.length} {selected.length === 1 ? "selecionado" : "selecionados"}</span> : <p>Selecione leads para executar ações em massa.</p>}</div>
      <ActionBar><button className="secondary" onClick={() => changeSelection(leads.map(item => item.id))}>Selecionar página</button><button className="secondary" onClick={() => changeSelection([])} disabled={!selected.length}>Limpar</button></ActionBar>
    </div>
    {selected.length > 0 && <ActionBar className="bulk-action-buttons"><button onClick={() => void favorite()}>Favoritar</button><button onClick={() => void analyze()}>Analisar</button><button onClick={() => { location.href = `/mensagens?leadIds=${selected.join(",")}`; }}>Criar mensagens</button><button onClick={() => void move()}>Mover etapa</button><button onClick={() => void addList()}>Adicionar à lista</button><button onClick={download}>Exportar</button><button className="secondary" onClick={() => changeSelection([])}>Limpar seleção</button></ActionBar>}
    {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
  </BulkActionBar>;
}

"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { RadarEntry } from "../../lib/intelligence/types";
import { ActionBar, BulkActionBar, EmptyState, FilterBar, FormField, SectionCard, StatusBadge, WorkspaceShell } from "../ui/interface";

type RadarOrder = "score_desc" | "score_asc" | "recent";

export default function RadarPage() {
  const [entries, setEntries] = useState<RadarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [minimumScore, setMinimumScore] = useState("0");
  const [priority, setPriority] = useState("");
  const [classification, setClassification] = useState("");
  const [withoutWebsite, setWithoutWebsite] = useState(false);
  const [order, setOrder] = useState<RadarOrder>("score_desc");
  const [selected, setSelected] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ minimumScore });
    if (priority) params.set("priority", priority);
    if (classification) params.set("classification", classification);
    if (withoutWebsite) params.set("withoutWebsite", "true");
    const response = await fetch(`/api/intelligence/radar?${params}`);
    if (response.ok) setEntries(await response.json());
    setLoading(false);
  }, [minimumScore, priority, classification, withoutWebsite]);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => [...entries].sort((a, b) => order === "score_asc" ? a.analysis.score - b.analysis.score : order === "recent" ? new Date(b.analysis.analyzedAt).getTime() - new Date(a.analysis.analyzedAt).getTime() : b.analysis.score - a.analysis.score), [entries, order]);
  async function addList() {
    const id = window.prompt("ID da lista:");
    if (id) await fetch("/api/prospect-lists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "add", id, leadIds: selected }) });
  }
  function toggle(id: string) { setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }

  return <WorkspaceShell page="radar" title="Radar de oportunidades" subtitle="Leads analisados e ordenados por potencial comercial.">
    <details className="radar-filter-disclosure" open>
      <summary>Filtros do Radar</summary>
      <FilterBar>
        <FormField id="radar-minimum-score" label="Score mínimo"><input id="radar-minimum-score" type="number" min="0" max="100" value={minimumScore} onChange={event => setMinimumScore(event.target.value)} /></FormField>
        <FormField id="radar-classification" label="Classificação"><select id="radar-classification" value={classification} onChange={event => setClassification(event.target.value)}><option value="">Todas</option><option>Excelente</option><option>Muito bom</option><option>Bom</option><option>Regular</option><option>Baixo</option></select></FormField>
        <FormField id="radar-priority" label="Prioridade"><select id="radar-priority" value={priority} onChange={event => setPriority(event.target.value)}><option value="">Todas</option><option>Alta</option><option>Média</option><option>Baixa</option><option>Bloqueada</option></select></FormField>
        <FormField id="radar-without-site" label="Presença digital"><div className="ui-check-control"><input id="radar-without-site" type="checkbox" checked={withoutWebsite} onChange={event => setWithoutWebsite(event.target.checked)} /><span>Sem site</span></div></FormField>
        <FormField id="radar-order" label="Ordenação"><select id="radar-order" value={order} onChange={event => setOrder(event.target.value as RadarOrder)}><option value="score_desc">Maior score</option><option value="score_asc">Menor score</option><option value="recent">Análise mais recente</option></select></FormField>
      </FilterBar>
    </details>

    <BulkActionBar>
      <div className="bulk-selection-controls">
        {selected.length === 0 ? <p>Selecione oportunidades para executar ações em massa.</p> : <span className="badge info">{selected.length} {selected.length === 1 ? "selecionado" : "selecionados"}</span>}
        {selected.length === 0 && <button className="secondary" onClick={() => setSelected(visible.map(item => item.lead.id))}>Selecionar filtrados</button>}
      </div>
      {selected.length > 0 && <ActionBar className="bulk-action-buttons"><button onClick={() => void addList()}>Adicionar à lista</button><button onClick={() => { location.href = `/mensagens?leadIds=${selected.join(",")}`; }}>Criar mensagens</button><button className="secondary" onClick={() => setSelected([])}>Limpar seleção</button></ActionBar>}
    </BulkActionBar>

    {loading ? <div className="radar-grid" aria-label="Carregando oportunidades"><SectionCard className="skeleton"><span className="sr-only">Carregando</span></SectionCard><SectionCard className="skeleton"><span className="sr-only">Carregando</span></SectionCard></div> : visible.length ? <div className="radar-grid">{visible.map(({ lead, analysis }) => {
      const checkboxId = `radar-lead-${lead.id}`;
      const reason = analysis.reasons[0] ?? analysis.positiveFactors[0] ?? "Análise comercial concluída.";
      return <SectionCard className="radar-card" key={lead.id}>
        <div className="radar-card-selection"><input id={checkboxId} type="checkbox" checked={selected.includes(lead.id)} onChange={() => toggle(lead.id)} /><label htmlFor={checkboxId}>Selecionar oportunidade</label></div>
        <div className="radar-card-heading"><div><h3>{lead.name}</h3><p>{lead.category || "Categoria não informada"} · {lead.city || "Cidade não informada"}</p></div><div className="radar-score" aria-label={`Score ${analysis.score}`}>{analysis.score}</div></div>
        <div className="radar-statuses"><StatusBadge status={analysis.classification} tone="success" /><StatusBadge status={analysis.priority} /></div>
        <div className="radar-card-section"><strong>Motivo principal</strong><p>{reason}</p></div>
        <div className="radar-card-section"><strong>Serviços recomendados</strong><p>{analysis.recommendedServices.length ? analysis.recommendedServices.map(item => item.name).join(" · ") : "Nenhum serviço recomendado."}</p></div>
        <footer className="radar-card-footer"><Link href={`/leads/${lead.id}`} className="secondary">Ver lead</Link></footer>
      </SectionCard>;
    })}</div> : <EmptyState title="Nenhuma oportunidade encontrada" description="Ajuste os filtros ou analise novos leads para preencher o Radar." />}
  </WorkspaceShell>;
}

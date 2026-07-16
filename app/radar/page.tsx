"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { RadarEntry } from "../../lib/intelligence/types";
import { ActionBar, BulkActionBar, EmptyState, FilterBar, FormField, InlineAlert, SectionCard, StatusBadge, WorkspaceShell } from "../ui/interface";

type RadarOrder = "score_desc" | "score_asc" | "recent";

function scoreLabel(score: number) {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Muito bom";
  if (score >= 55) return "Bom";
  if (score >= 40) return "Regular";
  return "Baixo";
}

function opportunityDetails(entry: RadarEntry) {
  const text = entry.analysis.reasons[0] ?? entry.analysis.opportunities[0] ?? entry.analysis.positiveFactors[0] ?? "Análise comercial concluída.";
  const points = text.match(/\+\s*(\d+)\s*(?:pontos?)?/i);
  return { label: text.replace(/:?\s*\+\s*\d+\s*(?:pontos?)?.*$/i, "").trim(), points: points ? Number(points[1]) : null };
}

export default function RadarPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<RadarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [minimumScore, setMinimumScore] = useState("0");
  const [priority, setPriority] = useState("");
  const [classification, setClassification] = useState("");
  const [withoutWebsite, setWithoutWebsite] = useState(false);
  const [order, setOrder] = useState<RadarOrder>("score_desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ minimumScore });
    if (priority) params.set("priority", priority);
    if (classification) params.set("classification", classification);
    if (withoutWebsite) params.set("withoutWebsite", "true");
    try {
      const response = await fetch(`/api/intelligence/radar?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar oportunidades.");
      setEntries(payload);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar oportunidades.");
    } finally { setLoading(false); }
  }, [minimumScore, priority, classification, withoutWebsite]);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => [...entries].sort((a, b) => order === "score_asc" ? a.analysis.score - b.analysis.score : order === "recent" ? new Date(b.analysis.analyzedAt).getTime() - new Date(a.analysis.analyzedAt).getTime() : b.analysis.score - a.analysis.score), [entries, order]);
  const summary = useMemo(() => ({ total: entries.length, high: entries.filter(item => item.analysis.priority === "Alta").length, medium: entries.filter(item => item.analysis.priority.toLocaleLowerCase("pt-BR").startsWith("m")).length, low: entries.filter(item => item.analysis.priority === "Baixa").length, average: entries.length ? Math.round(entries.reduce((total, item) => total + item.analysis.score, 0) / entries.length) : 0 }), [entries]);

  async function runBulkAction(name: string, action: () => Promise<void>) {
    setBusyAction(name); setError("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir a ação."); }
    finally { setBusyAction(""); }
  }
  async function addList() { const id = window.prompt("ID da lista:"); if (!id) return; const response = await fetch("/api/prospect-lists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "add", id, leadIds: selected }) }); if (!response.ok) throw new Error("Não foi possível adicionar as oportunidades à lista."); }
  async function moveCrm() { const stage = window.prompt("Mover para etapa:", "Contatado"); if (!stage) return; const responses = await Promise.all(selected.map(leadId => fetch("/api/crm/move", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ leadId, stage }) }))); if (responses.some(response => !response.ok)) throw new Error("Não foi possível mover todas as oportunidades."); }
  function exportSelected() { const chosen = entries.filter(item => selected.includes(item.lead.id)); const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`; const csv = ["nome,cidade,categoria,score,prioridade,classificacao", ...chosen.map(item => [item.lead.name, item.lead.city, item.lead.category, item.analysis.score, item.analysis.priority, item.analysis.classification].map(escape).join(","))].join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "oportunidades-radar.csv"; anchor.click(); URL.revokeObjectURL(url); }
  function toggle(id: string) { setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }
  function openLead(id: string) { router.push(`/leads/${id}`); }
  function clearFilters() { setMinimumScore("0"); setPriority(""); setClassification(""); setWithoutWebsite(false); setOrder("score_desc"); }

  return <WorkspaceShell page="radar" title="Radar de oportunidades" subtitle="Leads analisados e ordenados por potencial comercial.">
    {loading ? <section className="radar-summary radar-summary-skeleton" aria-label="Carregando resumo">{Array.from({ length: 5 }, (_, index) => <span className="skeleton" key={index} />)}</section> : <section className="radar-summary" aria-label="Resumo das oportunidades">
      <div className="radar-summary-card"><strong>{summary.total}</strong><span>Total de oportunidades</span></div><div className="radar-summary-card"><strong>{summary.high}</strong><span>Alta prioridade</span></div><div className="radar-summary-card"><strong>{summary.medium}</strong><span>Média prioridade</span></div><div className="radar-summary-card"><strong>{summary.low}</strong><span>Baixa prioridade</span></div><div className="radar-summary-card"><strong>{summary.average}</strong><span>Score médio</span></div>
    </section>}
    <details className="radar-filter-disclosure" open><summary>Filtros do Radar</summary><FilterBar>
      <FormField id="radar-minimum-score" label="Score mínimo"><input id="radar-minimum-score" type="number" min="0" max="100" value={minimumScore} onChange={event => setMinimumScore(String(Math.min(100, Math.max(0, Number(event.target.value))))) } /></FormField>
      <FormField id="radar-classification" label="Classificação"><select id="radar-classification" value={classification} onChange={event => setClassification(event.target.value)}><option value="">Todas</option><option>Excelente</option><option>Muito bom</option><option>Bom</option><option>Regular</option><option>Baixo</option></select></FormField>
      <FormField id="radar-priority" label="Prioridade"><select id="radar-priority" value={priority} onChange={event => setPriority(event.target.value)}><option value="">Todas</option><option>Alta</option><option>Média</option><option>Baixa</option><option>Bloqueada</option></select></FormField>
      <FormField id="radar-without-site" label="Presença digital"><div className="ui-check-control"><input id="radar-without-site" type="checkbox" checked={withoutWebsite} onChange={event => setWithoutWebsite(event.target.checked)} /><span>Sem site</span></div></FormField>
      <FormField id="radar-order" label="Ordenação"><select id="radar-order" value={order} onChange={event => setOrder(event.target.value as RadarOrder)}><option value="score_desc">Maior score</option><option value="score_asc">Menor score</option><option value="recent">Análise mais recente</option></select></FormField><div className="radar-filter-actions"><span role="status">{visible.length} {visible.length === 1 ? "resultado" : "resultados"}</span><button className="secondary" type="button" onClick={clearFilters}>Limpar filtros</button></div>
    </FilterBar></details>
    <BulkActionBar><div className="bulk-selection-controls"><strong>{selected.length} {selected.length === 1 ? "oportunidade selecionada" : "oportunidades selecionadas"}</strong><span className="sr-only">{selected.length > 0 ? "Ações em massa disponíveis." : "Selecione oportunidades para executar ações em massa."}</span><button className="secondary" disabled={!visible.length || Boolean(busyAction)} onClick={() => setSelected(visible.map(item => item.lead.id))}>Selecionar filtrados</button></div><ActionBar className="bulk-action-buttons"><button disabled={!selected.length || Boolean(busyAction)} onClick={() => void runBulkAction("list", addList)}>{busyAction === "list" ? "Adicionando…" : "Adicionar à lista"}</button><button disabled={!selected.length || Boolean(busyAction)} onClick={() => { location.href = `/mensagens?leadIds=${selected.join(",")}`; }}>Criar mensagens</button><details className="radar-more-actions"><summary className="secondary">Mais ações</summary><div><button disabled={!selected.length || Boolean(busyAction)} onClick={() => void runBulkAction("crm", moveCrm)}>{busyAction === "crm" ? "Movendo…" : "Mover no CRM"}</button><button disabled={!selected.length || Boolean(busyAction)} onClick={exportSelected}>Exportar</button><button className="secondary" disabled={!selected.length || Boolean(busyAction)} onClick={() => setSelected([])}>Limpar seleção</button></div></details></ActionBar></BulkActionBar>
    {error && <InlineAlert tone="error">{error}</InlineAlert>}
    {loading ? <div className="radar-grid radar-card-skeletons" aria-label="Carregando oportunidades">{Array.from({ length: 4 }, (_, index) => <SectionCard className="skeleton" key={index}><span className="sr-only">Carregando oportunidade</span></SectionCard>)}</div> : visible.length ? <div className="radar-grid">{visible.map(entry => {
      const { lead, analysis } = entry;
      const checkboxId = `radar-lead-${lead.id}`;
      const opportunity = opportunityDetails(entry), label = scoreLabel(analysis.score), services = analysis.recommendedServices.slice(0, 3), selectedCard = selected.includes(lead.id);
      return <SectionCard className={`radar-card radar-card-clickable${selectedCard ? " is-selected" : ""}`} key={lead.id}><div role="link" tabIndex={0} className="radar-card-hit-area" aria-label={`Abrir lead ${lead.name}`} onClick={() => openLead(lead.id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openLead(lead.id); } }}>
        <div className="radar-card-selection" onClick={event => event.stopPropagation()}><input id={checkboxId} type="checkbox" checked={selectedCard} onChange={() => toggle(lead.id)} /><label htmlFor={checkboxId}>Selecionar oportunidade</label></div>
        <div className="radar-card-heading"><div><h3>{lead.name}</h3><p>{lead.category || "Categoria não informada"} · {lead.city || "Cidade não informada"}</p></div><div className={`radar-score score-${label.toLowerCase().replace(" ", "-")}`} aria-label={`Score ${analysis.score} — ${label}`}><strong>{analysis.score}</strong><span>{label}</span></div></div>
        <div className="radar-statuses"><StatusBadge status={analysis.classification} tone="success" /><StatusBadge status={analysis.priority} /></div>
        <div className="radar-opportunity"><span>Maior oportunidade</span><strong>{opportunity.label}</strong>{opportunity.points !== null && <b>+{opportunity.points} pontos</b>}</div>
        <div className="radar-card-section"><strong>Serviços recomendados</strong>{services.length ? <div className="radar-service-chips">{services.map(item => <span key={item.name}>{item.name}</span>)}{analysis.recommendedServices.length > 3 && <span title={analysis.recommendedServices.slice(3).map(item => item.name).join(", ")} aria-label={`${analysis.recommendedServices.length - 3} serviços adicionais`}>+{analysis.recommendedServices.length - 3}</span>}</div> : <p>Nenhum serviço recomendado.</p>}</div>
        <footer className="radar-card-footer" onClick={event => event.stopPropagation()}><Link href={`/leads/${lead.id}`} className="secondary">Ver lead</Link></footer>
      </div></SectionCard>;
    })}</div> : <EmptyState title="Nenhuma oportunidade encontrada" description="Ajuste os filtros ou analise novos leads para preencher o Radar." />}
  </WorkspaceShell>;
}

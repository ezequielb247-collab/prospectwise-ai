"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  CsvColumnMapping,
  CsvField,
  CsvPreview,
} from "../../../lib/csv-import/types";
import { googleMapsTextToCsv } from "../../../lib/google-maps-paste";
import {
  analyzeImportedLeads,
  type AnalysisProgress,
} from "../../../lib/intelligence/client-batch";
const MAX_SIZE = 2 * 1024 * 1024;
const fields: Array<{ value: CsvField | "ignore"; label: string }> = [
  { value: "ignore", label: "Ignorar coluna" },
  { value: "name", label: "Nome" },
  { value: "phone", label: "Telefone" },
  { value: "website", label: "Site" },
  { value: "address", label: "Endereço" },
  { value: "city", label: "Cidade" },
  { value: "state", label: "Estado" },
  { value: "category", label: "Categoria" },
  { value: "rating", label: "Nota" },
  { value: "reviews", label: "Avaliações" },
  { value: "mapsUrl", label: "Google Maps URL" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
];
type Campaign = { id: string; name: string };
type ImportResult = {
  imported: number;
  duplicates: number;
  invalid: number;
  leadIds: string[];
};
export default function CsvImportPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [mode, setMode] = useState<"file" | "paste" | "maps">("file");
  const [text, setText] = useState("");
  const [preparedText, setPreparedText] = useState("");
  const [mapsParsedCount, setMapsParsedCount] = useState(0);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [preview, setPreview] = useState<Omit<CsvPreview, "rows">>();
  const [result, setResult] = useState<ImportResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>();
  useEffect(() => {
    fetch("/api/campaigns")
      .then((response) => response.json())
      .then((data) => {
        const items = data.campaigns ?? [];
        setCampaigns(items);
        const requested = new URLSearchParams(window.location.search).get(
          "campaignId",
        );
        setCampaignId(
          items.some((item: Campaign) => item.id === requested)
            ? requested
            : (items[0]?.id ?? ""),
        );
      })
      .catch(() => setError("Não foi possível carregar as campanhas."));
  }, []);
  async function readFile(file: File | undefined) {
    setError("");
    setResult(undefined);
    setPreview(undefined);
    setPreparedText("");
    setMapsParsedCount(0);
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError("Arquivo maior que 2 MB.");
      return;
    }
    if (
      !file.name.toLowerCase().endsWith(".csv") &&
      !file.type.includes("csv")
    ) {
      setError("Selecione um arquivo CSV.");
      return;
    }
    setFileName(file.name);
    setText(await file.text());
  }
  async function generatePreview(nextMapping = mapping) {
    if (!text.trim()) {
      setError(mode === "maps" ? "Cole os dados copiados do Google Maps." : "Selecione um CSV ou cole os dados.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(undefined);
    try {
      let importText = text;
      if (mode === "maps") {
        const converted = googleMapsTextToCsv(text);
        if (!converted.leads.length)
          throw new Error("Não encontrei nenhuma empresa no texto do Google Maps. Copie o painel da empresa ou a lista de resultados e tente novamente.");
        importText = converted.csv;
        setMapsParsedCount(converted.leads.length);
      } else {
        setMapsParsedCount(0);
      }
      setPreparedText(importText);
      const response = await fetch("/api/import/csv/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId, text: importText, mapping: nextMapping }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? data.error);
      setPreview(data);
      const suggestions = Object.fromEntries(
        data.headers.map(
          (header: { source: string; suggested: CsvField | "ignore" }) => [
            header.source,
            nextMapping[header.source] ?? header.suggested,
          ],
        ),
      );
      setMapping(suggestions);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Falha ao analisar os dados.",
      );
      setPreview(undefined);
    } finally {
      setLoading(false);
    }
  }
  async function commit() {
    if (!campaignId || !preview || !preparedText) return;
    setLoading(true);
    setError("");
    setAnalysisProgress(undefined);
    try {
      const response = await fetch("/api/import/csv/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId, text: preparedText, mapping }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
      await analyzeImportedLeads(campaignId, data.leadIds, setAnalysisProgress);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Falha ao importar empresas.",
      );
    } finally {
      setLoading(false);
    }
  }
  function changeMode(next: "file" | "paste" | "maps") {
    setMode(next);
    setText("");
    setPreparedText("");
    setPreview(undefined);
    setResult(undefined);
    setError("");
    setFileName("");
    setMapsParsedCount(0);
    setMapping({});
  }
  return (
    <main className="form-page csv-import-page">
      <Link href="/leads">← Voltar para leads</Link>
      <section className="csv-import-shell">
        <article className="panel csv-source">
          <div className="panel-head">
            <div>
              <h1>Importar empresas</h1>
              <p>Use CSV, dados de planilha ou texto copiado do Google Maps. Revise tudo antes de salvar.</p>
            </div>
            <a
              className="secondary compact"
              href="/modelo-importacao-leads.csv"
              download
            >
              Baixar modelo
            </a>
          </div>
          <label>
            Campanha
            <select
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
            >
              <option value="">Selecione uma campanha</option>
              {campaigns.map((campaign) => (
                <option value={campaign.id} key={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <div className="csv-mode" role="group" aria-label="Origem dos dados">
            <button
              className={mode === "file" ? "active" : ""}
              onClick={() => changeMode("file")}
            >
              Enviar CSV
            </button>
            <button
              className={mode === "paste" ? "active" : ""}
              onClick={() => changeMode("paste")}
            >
              Colar planilha
            </button>
            <button
              className={mode === "maps" ? "active" : ""}
              onClick={() => changeMode("maps")}
            >
              Colar Google Maps
            </button>
          </div>
          {mode === "file" ? (
            <label className="csv-drop">
              CSV de até 2 MB
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => void readFile(event.target.files?.[0])}
              />
              <span>{fileName || "Escolher arquivo CSV"}</span>
            </label>
          ) : mode === "maps" ? (
            <label>
              Texto copiado do Google Maps
              <textarea
                className="csv-paste"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setPreparedText("");
                  setPreview(undefined);
                  setResult(undefined);
                  setMapsParsedCount(0);
                }}
                placeholder={"Cole aqui o painel de uma empresa ou vários resultados copiados do Google Maps.\n\nEx.:\nOficina Exemplo\n4,8\n(120)\nOficina mecânica\nAv. Exemplo, 100 - Centro, Macaé - RJ\n(22) 99999-9999"}
              />
              <small>O ProspectWise tenta identificar nome, telefone, endereço, cidade, categoria, nota e avaliações. Você confirma tudo na prévia.</small>
            </label>
          ) : (
            <label>
              Dados copiados da planilha
              <textarea
                className="csv-paste"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setPreparedText("");
                  setPreview(undefined);
                  setResult(undefined);
                }}
                placeholder={
                  "nome,telefone,cidade\nEmpresa Exemplo,19999999999,Campinas"
                }
              />
            </label>
          )}
          <button
            className="primary full"
            disabled={loading || !text || !campaignId}
            onClick={() => void generatePreview()}
          >
            {loading ? "Processando…" : mode === "maps" ? "Identificar empresas e pré-visualizar" : "Pré-visualizar dados"}
          </button>
          {mapsParsedCount > 0 && <div className="ui-alert info" role="status">{mapsParsedCount} {mapsParsedCount === 1 ? "empresa identificada" : "empresas identificadas"} no texto do Google Maps.</div>}
          {error && <div className="search-error">{error}</div>}
        </article>
        <section className="csv-preview">
          {preview ? (
            <>
              <div className="import-metrics">
                {[
                  ["Linhas válidas", preview.stats.valid, "green"],
                  ["Inválidas", preview.stats.invalid, "rose"],
                  ["Duplicadas", preview.stats.duplicates, "amber"],
                  ["Total", preview.stats.total, "violet"],
                ].map(([label, value, tone]) => (
                  <article className="panel" key={String(label)}>
                    <span className={`metric-dot ${tone}`} />
                    <small>{label}</small>
                    <b>{value}</b>
                  </article>
                ))}
              </div>
              <article className="panel">
                <div className="panel-head">
                  <div>
                    <h3>Relacionamento de colunas</h3>
                    <p>Confirme como cada coluna será interpretada.</p>
                  </div>
                  <button
                    className="secondary compact"
                    onClick={() => void generatePreview(mapping)}
                  >
                    Atualizar prévia
                  </button>
                </div>
                <div className="column-mapping">
                  {preview.headers.map((header) => (
                    <label key={header.source}>
                      <span>
                        {header.source}
                        {!header.recognized && <em>desconhecida</em>}
                      </span>
                      <select
                        value={mapping[header.source] ?? header.suggested}
                        onChange={(event) =>
                          setMapping((current) => ({
                            ...current,
                            [header.source]: event.target.value as
                              CsvField | "ignore",
                          }))
                        }
                      >
                        {fields.map((field) => (
                          <option value={field.value} key={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </article>
              <article className="panel">
                <h3>Exemplos que serão importados</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Linha</th>
                        <th>Empresa</th>
                        <th>Telefone</th>
                        <th>Cidade/UF</th>
                        <th>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.examples.map((row) => (
                        <tr key={row.line}>
                          <td>{row.line}</td>
                          <td>{row.lead.name || "—"}</td>
                          <td>{row.lead.phone || "—"}</td>
                          <td>
                            {[row.lead.city, row.lead.state]
                              .filter(Boolean)
                              .join("/") || "—"}
                          </td>
                          <td>
                            <span
                              className={`badge ${!row.valid ? "warning" : row.duplicate ? "neutral" : "success"}`}
                            >
                              {!row.valid
                                ? row.errors.join(", ")
                                : row.duplicate
                                  ? "Duplicada"
                                  : "Válida"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="missing-summary">
                  <b>Campos ausentes</b>
                  {Object.entries(preview.missingFields)
                    .filter(([, count]) => count)
                    .map(([field, count]) => (
                      <span key={field}>
                        {fields.find((item) => item.value === field)?.label ??
                          field}
                        : {count}
                      </span>
                    ))}
                </div>
                <button
                  className="primary full"
                  disabled={loading || preview.stats.valid === 0}
                  onClick={() => void commit()}
                >
                  {loading
                    ? "Importando…"
                    : `Importar ${preview.stats.valid} ${preview.stats.valid === 1 ? "empresa" : "empresas"}`}
                </button>
              </article>
            </>
          ) : (
            <div className="empty search-empty">
              <span>⇧</span>
              <h3>Prévia da importação</h3>
              <p>
                Os dados normalizados, duplicidades e campos ausentes aparecerão
                aqui.
              </p>
            </div>
          )}
          {result && (
            <article className="panel import-success">
              <span>✓</span>
              <h3>{result.imported} {result.imported === 1 ? "empresa importada" : "empresas importadas"}</h3>
              <p>
                {result.duplicates} duplicadas e {result.invalid} inválidas não
                foram importadas.
              </p>
              {analysisProgress && (
                <div className="analysis-progress" aria-live="polite">
                  <div className="progress-row">
                    <b>Análise automática</b>
                    <span>{analysisProgress.percentage}%</span>
                  </div>
                  <div className="bar">
                    <span style={{ width: `${Math.min(100, analysisProgress.percentage)}%` }} />
                  </div>
                  <small>
                    {analysisProgress.processed} de {analysisProgress.total} leads analisados
                  </small>
                </div>
              )}
              <div className="post-import-actions">
                <Link
                  className="primary"
                  href={`/radar?campaignId=${campaignId}`}
                >
                  Abrir Radar
                </Link>
                <Link
                  className="secondary"
                  href={`/crm?campaignId=${campaignId}`}
                >
                  Abrir CRM
                </Link>
              </div>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}

"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { LeadResult } from "../../../lib/providers";
import type { ImportStats } from "../../../lib/search-companies-service";
type SearchValues = {
  campaignId: string;
  city: string;
  state: string;
  category: string;
  quantity: number;
};
type SearchResponse = {
  companies: LeadResult[];
  stats: ImportStats;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
};
export default function Page() {
  const [campaigns,setCampaigns]=useState<Array<{id:string;name:string}>>([]);
  const [provider, setProvider] = useState<"mock" | "outscraper">("mock");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState<SearchValues>({
    campaignId: "",
    city: "Campinas",
    state: "SP",
    category: "Clínica odontológica",
    quantity: 10,
  });
  useEffect(() => {
    const task = setTimeout(() => {
      Promise.all([fetch("/api/campaigns").then(response=>response.json()),fetch("/api/integrations").then(response=>response.json())]).then(([campaignData,settings])=>{setCampaigns(campaignData.campaigns??[]);setLastQuery(current=>({...current,campaignId:campaignData.campaigns?.[0]?.id??""}));setProvider(settings.provider==="outscraper"?"outscraper":"mock");setLimit(settings.searchLimit??10)}).catch(()=>setError("Não foi possível carregar campanhas e configurações."));
    }, 0);
    return () => clearTimeout(task);
  }, []);
  async function search(page = 1, values = lastQuery) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/search-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          quantity: Math.min(values.quantity, limit),
          provider,
          page,
          pageSize: 5,
        }),
      });
      const data = (await response.json()) as SearchResponse;
      if (!response.ok)
        throw new Error(data.error ?? "Não foi possível buscar empresas.");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha na busca.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: SearchValues = {
      campaignId: String(form.get("campaignId")),
      city: String(form.get("city")),
      state: String(form.get("state")),
      category: String(form.get("category")),
      quantity: Number(form.get("quantity")),
    };
    setLastQuery(values);
    void search(1, values);
  }
  return (
    <main className="form-page search-companies-page">
      <Link href="/leads">← Voltar para leads</Link>
      <section className="search-shell">
        <div className="panel search-form-panel">
          <div className="panel-head">
            <div>
              <h1>Buscar empresas</h1>
              <p>Toda empresa será vinculada à campanha selecionada.</p>
            </div>
            <span
              className={`badge ${provider === "mock" ? "info" : "success"}`}
            >
              {provider === "mock" ? "Mock" : "Outscraper"}
            </span>
          </div>
          <form onSubmit={submit}>
            <label>
              Campanha
              <select name="campaignId" defaultValue={lastQuery.campaignId}>
                {campaigns.map((campaign) => (
                  <option value={campaign.id} key={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <label>
                Cidade
                <input name="city" required defaultValue="Campinas" />
              </label>
              <label>
                Estado
                <input name="state" maxLength={2} defaultValue="SP" />
              </label>
            </div>
            <label>
              Categoria
              <input
                name="category"
                required
                defaultValue="Clínica odontológica"
              />
            </label>
            <label>
              Quantidade
              <input
                name="quantity"
                type="number"
                min="1"
                max={limit}
                defaultValue={Math.min(10, limit)}
              />
              <small>Limite configurado: {limit} empresas</small>
            </label>
            <button className="primary full" disabled={loading}>
              {loading ? "Buscando..." : "⌕ Buscar Empresas"}
            </button>
          </form>
          {error && <div className="search-error">{error}</div>}
        </div>
        <div className="search-results">
          <div className="import-metrics">
            {[
              ["Empresas importadas", result?.stats.imported ?? 0, "green"],
              ["Duplicadas", result?.stats.duplicates ?? 0, "amber"],
              ["Ignoradas", result?.stats.ignored ?? 0, "violet"],
              ["Erros", result?.stats.errors ?? 0, "rose"],
            ].map(([label, value, tone]) => (
              <article className="panel" key={String(label)}>
                <span className={`metric-dot ${tone}`} />
                <small>{label}</small>
                <b>{value}</b>
              </article>
            ))}
          </div>
          {result ? (
            <article className="panel leads-panel">
              <div className="panel-head">
                <div>
                  <h3>Resultados importados</h3>
                  <p>
                    {result.pagination.total} empresas vinculadas à campanha
                  </p>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Categoria</th>
                      <th>Endereço</th>
                      <th>Telefone</th>
                      <th>Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.companies.map((company) => (
                      <tr key={company.externalId}>
                        <td>
                          <b>{company.name}</b>
                        </td>
                        <td>{company.category}</td>
                        <td>{company.address}</td>
                        <td>{company.phone ?? "—"}</td>
                        <td>
                          {company.website ? "Encontrado" : "Não encontrado"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button
                  className="secondary"
                  disabled={result.pagination.page <= 1 || loading}
                  onClick={() => void search(result.pagination.page - 1)}
                >
                  ← Anterior
                </button>
                <span>
                  Página {result.pagination.page} de{" "}
                  {result.pagination.totalPages}
                </span>
                <button
                  className="secondary"
                  disabled={
                    result.pagination.page >= result.pagination.totalPages ||
                    loading
                  }
                  onClick={() => void search(result.pagination.page + 1)}
                >
                  Próxima →
                </button>
              </div>
            </article>
          ) : (
            <div className="empty search-empty">
              <span>⌕</span>
              <h3>Pronto para pesquisar</h3>
              <p>Os resultados aparecerão aqui após a importação.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

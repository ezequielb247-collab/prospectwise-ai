"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  reanalyzeCampaign,
  type AnalysisProgress,
} from "../lib/intelligence/client-batch";

type Summary = {
  analyses: unknown[];
  averageScore: number;
  excellent: number;
  highPriority: number;
  topServices: { name: string; count: number }[];
};

export default function CampaignIntelligence({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Summary>();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<AnalysisProgress>();
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/intelligence/campaigns/${campaignId}`);
    if (!response.ok) throw new Error("Não foi possível carregar a análise.");
    setData(await response.json());
  }, [campaignId]);

  async function recalculate() {
    setLoading(true);
    setError("");
    setProgress(undefined);
    try {
      await reanalyzeCampaign(campaignId, setProgress);
      await load();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha na reanálise.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch(`/api/intelligence/campaigns/${campaignId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar a análise.");
        setData(await response.json());
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Falha ao carregar."),
      )
      .finally(() => setLoading(false));
  }, [campaignId]);

  return (
    <article className="panel campaign-intelligence">
      <div className="panel-head">
        <div>
          <h3>Inteligência da campanha</h3>
          <p>Qualificação determinística dos leads desta campanha</p>
        </div>
        <button
          className="primary compact"
          disabled={loading}
          onClick={() => void recalculate()}
        >
          {loading && progress
            ? `Reanalisando ${progress.percentage}%`
            : "Reanalisar campanha"}
        </button>
      </div>
      {error && <p className="search-error">{error}</p>}
      {progress && (
        <div className="bar" aria-label={`Progresso ${progress.percentage}%`}>
          <span style={{ width: `${progress.percentage}%` }} />
        </div>
      )}
      {data?.analyses.length ? (
        <>
          <div className="intelligence-metrics">
            <span><b>{data.averageScore}</b>Score médio</span>
            <span><b>{data.excellent}</b>Excelentes</span>
            <span><b>{data.highPriority}</b>Alta prioridade</span>
          </div>
          <div className="top-services">
            <b>Serviços mais recomendados</b>
            {data.topServices.map((item) => (
              <span key={item.name}>{item.name} <small>{item.count}</small></span>
            ))}
          </div>
        </>
      ) : (
        !loading && <div className="empty small"><h3>Nenhum lead analisado</h3></div>
      )}
    </article>
  );
}

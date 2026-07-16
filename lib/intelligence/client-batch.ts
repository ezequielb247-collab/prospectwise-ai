export type AnalysisProgress = {
  processed: number;
  total: number;
  percentage: number;
};

const BATCH_SIZE = 50;

async function postBatch(campaignId: string, body: object) {
  const response = await fetch(`/api/intelligence/campaigns/${campaignId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "Não foi possível analisar os leads.");
  return data as {
    processed: number;
    total: number;
    nextOffset?: number;
    done: boolean;
  };
}

export async function analyzeImportedLeads(
  campaignId: string,
  leadIds: string[],
  onProgress: (progress: AnalysisProgress) => void,
) {
  let processed = 0;
  onProgress({ processed, total: leadIds.length, percentage: 0 });
  for (let index = 0; index < leadIds.length; index += BATCH_SIZE) {
    const batch = leadIds.slice(index, index + BATCH_SIZE);
    const result = await postBatch(campaignId, { leadIds: batch });
    processed += result.processed;
    onProgress({
      processed,
      total: leadIds.length,
      percentage: leadIds.length
        ? Math.round((processed / leadIds.length) * 100)
        : 100,
    });
  }
}

export async function reanalyzeCampaign(
  campaignId: string,
  onProgress: (progress: AnalysisProgress) => void,
) {
  let offset = 0;
  let total = 0;
  do {
    const result = await postBatch(campaignId, {
      offset,
      limit: BATCH_SIZE,
      recalculate: true,
    });
    offset = result.nextOffset ?? offset + result.processed;
    total = result.total;
    onProgress({
      processed: offset,
      total,
      percentage: total
        ? Math.min(100, Math.round((offset / total) * 100))
        : 100,
    });
    if (result.done) break;
  } while (offset < total);
}

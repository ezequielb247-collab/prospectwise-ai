export type PersistedLeadAnalysis = {
  user_id?: string;
  lead_id: string;
  campaign_id?: string;
  score: number;
  classification: string;
  priority: string;
  recommended_services?: { name?: string }[] | null;
  reasons?: string[] | null;
  analyzed_at: string;
};

/** Selects the official analysis snapshot: the newest persisted row per lead. */
export function latestAnalysisByLead(
  rows: PersistedLeadAnalysis[],
  userId?: string,
) {
  const latest = new Map<string, PersistedLeadAnalysis>();
  for (const row of rows) {
    if (userId && row.user_id !== userId) continue;
    const current = latest.get(row.lead_id);
    if (!current || row.analyzed_at > current.analyzed_at) {
      latest.set(row.lead_id, row);
    }
  }
  return latest;
}

export function analysisSnapshot(row?: PersistedLeadAnalysis) {
  if (!row) return undefined;
  return {
    score: Number(row.score),
    classification: row.classification,
    priority: row.priority,
    services: (row.recommended_services ?? [])
      .map((service) => service.name)
      .filter(Boolean) as string[],
    reasons: row.reasons ?? [],
    analyzedAt: row.analyzed_at,
  };
}

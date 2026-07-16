import assert from "node:assert/strict";
import test from "node:test";
import {
  analysisSnapshot,
  latestAnalysisByLead,
  type PersistedLeadAnalysis,
} from "../lib/intelligence/latest-analysis";

const row = (
  leadId: string,
  score: number,
  analyzedAt: string,
  userId = "user-a",
): PersistedLeadAnalysis => ({
  user_id: userId,
  lead_id: leadId,
  campaign_id: "campaign-a",
  score,
  classification: score >= 70 ? "Excelente" : "Regular",
  priority: score >= 70 ? "Alta" : "Média",
  recommended_services: [{ name: "Site institucional" }],
  reasons: ["Análise persistida"],
  analyzed_at: analyzedAt,
});

test("lead analisado projeta score, prioridade, classificação e serviços persistidos", () => {
  const snapshot = analysisSnapshot(row("lead-a", 82, "2026-07-16T12:00:00Z"));
  assert.equal(snapshot?.score, 82);
  assert.equal(snapshot?.priority, "Alta");
  assert.equal(snapshot?.classification, "Excelente");
  assert.deepEqual(snapshot?.services, ["Site institucional"]);
});

test("lead sem análise não produz score zero", () => {
  assert.equal(analysisSnapshot(undefined), undefined);
});

test("reanálise mais recente vence a análise antiga", () => {
  const analyses = latestAnalysisByLead([
    row("lead-a", 30, "2026-07-15T12:00:00Z"),
    row("lead-a", 82, "2026-07-16T12:00:00Z"),
  ]);
  assert.equal(analyses.get("lead-a")?.score, 82);
});

test("análises permanecem isoladas por usuário", () => {
  const analyses = latestAnalysisByLead(
    [
      row("lead-a", 82, "2026-07-16T12:00:00Z", "user-a"),
      row("lead-b", 99, "2026-07-16T12:00:00Z", "user-b"),
    ],
    "user-a",
  );
  assert.deepEqual([...analyses.keys()], ["lead-a"]);
});

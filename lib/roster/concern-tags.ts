import type { CohortStudentRow } from "@/app/api/cohort/route";

/** Structured concern taxonomy — mirrors derivation priority in qn-roster. */
export type ConcernTagId =
  | "advisor_action"
  | "aims"
  | "gpa_declining"
  | "ag_missing"
  | "ag_dual_flag"
  | "cores_missing"
  | "ncaa_pivot";

export type ConcernTag = {
  id: ConcernTagId;
  label: string;
};

const TAG_META: Record<ConcernTagId, { label: string; priority: number }> = {
  advisor_action: { label: "Advisor action", priority: 0 },
  aims: { label: "AIMS concern", priority: 1 },
  gpa_declining: { label: "GPA declining", priority: 2 },
  ag_missing: { label: "A-G gap", priority: 3 },
  ag_dual_flag: { label: "A-G dual flag", priority: 4 },
  cores_missing: { label: "Cores missing", priority: 5 },
  ncaa_pivot: { label: "NCAA pivot required", priority: 6 },
};

export function deriveConcernTags(row: CohortStudentRow): ConcernTag[] {
  const ids: ConcernTagId[] = [];

  if (row.recommendedAdvisorAction?.trim()) {
    ids.push("advisor_action");
  }
  if (row.aimsRisk === "HIGH" || row.aimsRisk === "ESCALATED") {
    ids.push("aims");
  }
  if (row.gpaTrajectory === "declining") {
    ids.push("gpa_declining");
  }
  if (row.agMissingCount > 0) {
    ids.push("ag_missing");
  }
  if (row.agDualFlagCount > 0) {
    ids.push("ag_dual_flag");
  }
  if (row.missingTotal > 0) {
    ids.push("cores_missing");
  }
  if (row.riskBand === "LOCKED") {
    ids.push("ncaa_pivot");
  }

  return ids
    .sort((a, b) => TAG_META[a].priority - TAG_META[b].priority)
    .map((id) => ({ id, label: TAG_META[id].label }));
}

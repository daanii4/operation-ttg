/**
 * Sprint 6 / Workstream A4-2 — UI display label maps.
 *
 * Centralizes every machine-code → human-string translation used by the
 * Roster, Briefings, Trajectory, and Eligibility tabs. A component must NOT
 * render any of these raw machine codes directly. Use the helper at the
 * bottom of this file for safe lookups (returns the muted "—" fallback when
 * a code is missing).
 *
 * Why one file? Sprint 6 audits the UI for raw machine strings. Spreading
 * these across each component makes that audit fragile; one file makes it
 * possible to grep for `display-labels` and see every consumer at once.
 */

import type {
  AimsCrossLayerFlag,
  AimsRiskBand,
  EngagementTrend,
  EvidenceTier,
  TrajectoryDirection,
} from "./types";

/* -------------------------------------------------------------------------- */
/* F9 — GPA Trajectory                                                         */
/* -------------------------------------------------------------------------- */

export const TRAJECTORY_DIRECTION_LABELS: Record<string, string> = {
  improving: "Improving",
  declining: "Declining",
  flat_or_uncertain: "Flat / Uncertain",
  insufficient: "Insufficient data",
};

export const TRAJECTORY_INSUFFICIENT_LABELS: Record<string, string> = {
  insufficient_grade_data: "Not enough recent grade observations",
  no_recent_term: "No grades recorded for the most recent term",
  inconsistent_data_class: "Mixed data sources prevent reliable trajectory",
};

/* -------------------------------------------------------------------------- */
/* F10 — AIMS Psychometric                                                     */
/* -------------------------------------------------------------------------- */

export const AIMS_RISK_LABELS: Record<string, string> = {
  Low: "Low risk",
  Moderate: "Moderate risk",
  High: "High risk",
  Insufficient: "Insufficient data",
};

export const AIMS_FLAG_LABELS: Record<string, string> = {
  identity_threat_high: "Identity threat signal elevated",
  exclusivity_high: "Athletic exclusivity score rising",
  negative_affect_rising: "Negative affectivity increasing",
  composite_risk_elevated: "All three AIMS sub-scales moving adversely",
};

/* -------------------------------------------------------------------------- */
/* F11 — Engagement                                                            */
/* -------------------------------------------------------------------------- */

export const ENGAGEMENT_TREND_LABELS: Record<string, string> = {
  rising: "Improving",
  declining: "Declining",
  stable: "Stable",
  insufficient: "Insufficient data",
};

/* -------------------------------------------------------------------------- */
/* Evidence tiers                                                              */
/* -------------------------------------------------------------------------- */

export const EVIDENCE_TIER_LABELS: Record<string, string> = {
  Deterministic: "Verified data",
  Provisional: "Provisional — mixed sources",
  Insufficient: "Insufficient data",
  Strong: "Strong evidence",
  Moderate: "Moderate evidence",
  Weak: "Weak evidence",
  Not_Applicable: "Not applicable",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Safe lookup that returns "—" when a code is missing rather than the raw
 * machine string. Components should pass `null`/`undefined` through; this
 * function will short-circuit to the muted fallback.
 */
export function displayLabel(
  table: Record<string, string>,
  code: string | null | undefined
): string {
  if (!code) return "—";
  return table[code] ?? "—";
}

export function trajectoryDirectionLabel(direction: TrajectoryDirection | null | undefined) {
  return displayLabel(TRAJECTORY_DIRECTION_LABELS, direction);
}

export function aimsRiskLabel(band: AimsRiskBand | null | undefined) {
  return displayLabel(AIMS_RISK_LABELS, band);
}

export function aimsFlagLabel(flag: AimsCrossLayerFlag | string | null | undefined) {
  return displayLabel(AIMS_FLAG_LABELS, flag ?? null);
}

export function engagementTrendLabel(trend: EngagementTrend | null | undefined) {
  return displayLabel(ENGAGEMENT_TREND_LABELS, trend);
}

export function evidenceTierLabel(tier: EvidenceTier | string | null | undefined) {
  return displayLabel(EVIDENCE_TIER_LABELS, tier ?? null);
}


/* -------------------------------------------------------------------------- */
/* Sprint 7 / Workstream ML — Risk forecast labels.                            */
/* -------------------------------------------------------------------------- */

export const ML_RISK_TIER_LABELS: Record<string, string> = {
  high: "High probability of eligibility risk",
  moderate: "Moderate probability — monitor closely",
  low: "Low probability — on track",
};

export function mlRiskTierLabel(tier: string | null | undefined): string {
  return displayLabel(ML_RISK_TIER_LABELS, tier ?? null);
}

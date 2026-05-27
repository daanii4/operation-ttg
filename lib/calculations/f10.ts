/**
 * F10 — AIMS Risk Signal
 * Source: Brewer, Van Raalte & Linder (1993) https://doi.org/10.1177/002188639302900102
 * Threshold method: within-subject percentage delta (v0.1 placeholder — see THRESHOLD_PENDING_D3)
 */

import type { AimsCrossLayerFlag, F10Result } from "./types";

export type AimsAssessmentInput = {
  social_identity_score: number;
  exclusivity_score: number;
  negative_affectivity_score: number;
  administered_at: Date;
  aims_version: string;
};

export type AimsThresholdConfig = {
  method: string;
  pct_delta_threshold: number;
};

function totalScore(row: AimsAssessmentInput): number {
  return (
    row.social_identity_score +
    row.exclusivity_score +
    row.negative_affectivity_score
  );
}

function pctDelta(current: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return (current - baseline) / baseline;
}

export function calcAimsRiskSignal(
  assessments: AimsAssessmentInput[],
  thresholdConfig: AimsThresholdConfig,
  referenceDate: Date = new Date()
): F10Result {
  const ordered = [...assessments].sort(
    (a, b) => a.administered_at.getTime() - b.administered_at.getTime()
  );

  if (ordered.length <= 1) {
    return {
      risk_band: "Insufficient",
      total_score_baseline: ordered[0] ? totalScore(ordered[0]) : null,
      total_score_current: ordered[0] ? totalScore(ordered[0]) : null,
      within_subject_delta_pct: null,
      cross_layer_flags: [],
      version_mismatch: false,
      evidence_tier: "Insufficient",
      threshold_method: thresholdConfig.method,
      insufficient_reason: "baseline_only_no_delta",
    };
  }

  const versions = new Set(ordered.map((row) => row.aims_version));
  if (versions.size > 1) {
    return {
      risk_band: "Insufficient",
      total_score_baseline: null,
      total_score_current: null,
      within_subject_delta_pct: null,
      cross_layer_flags: [],
      version_mismatch: true,
      evidence_tier: "Insufficient",
      threshold_method: thresholdConfig.method,
      insufficient_reason: "version_mismatch",
    };
  }

  const baseline = ordered[0]!;
  const current = ordered[ordered.length - 1]!;
  const totalBaseline = totalScore(baseline);
  const totalCurrent = totalScore(current);
  const delta = pctDelta(totalCurrent, totalBaseline);

  if (delta === null) {
    return {
      risk_band: "Insufficient",
      total_score_baseline: totalBaseline,
      total_score_current: totalCurrent,
      within_subject_delta_pct: null,
      cross_layer_flags: [],
      version_mismatch: false,
      evidence_tier: "Insufficient",
      threshold_method: thresholdConfig.method,
      insufficient_reason: "baseline_only_no_delta",
    };
  }

  const threshold = thresholdConfig.pct_delta_threshold;

  const socialDelta = pctDelta(current.social_identity_score, baseline.social_identity_score);
  const exclusivityDelta = pctDelta(current.exclusivity_score, baseline.exclusivity_score);
  const negativeAffectDelta = pctDelta(
    current.negative_affectivity_score,
    baseline.negative_affectivity_score
  );

  const flags: AimsCrossLayerFlag[] = [];

  const identityThreatHigh = socialDelta !== null && socialDelta < -threshold;
  const exclusivityHigh = exclusivityDelta !== null && exclusivityDelta > threshold;
  const negativeAffectRising =
    negativeAffectDelta !== null && negativeAffectDelta > threshold;

  if (identityThreatHigh) flags.push("identity_threat_high");
  if (exclusivityHigh) flags.push("exclusivity_high");
  if (negativeAffectRising) flags.push("negative_affect_rising");
  if (identityThreatHigh && exclusivityHigh && negativeAffectRising) {
    flags.push("composite_risk_elevated");
  }

  const absDelta = Math.abs(delta);
  const risk_band =
    absDelta < threshold
      ? "Low"
      : absDelta < threshold * 2
        ? "Moderate"
        : "High";

  return {
    risk_band,
    total_score_baseline: totalBaseline,
    total_score_current: totalCurrent,
    within_subject_delta_pct: delta,
    cross_layer_flags: flags,
    version_mismatch: false,
    evidence_tier: "Strong",
    threshold_method: thresholdConfig.method,
    insufficient_reason: null,
  };
}

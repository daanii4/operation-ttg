/**
 * Sprint 7 / Workstream ML-2 — feature extraction.
 *
 * Converts an F1–F12 result set into a fixed-length numeric vector for the
 * logistic regression model in `lib/ml/logisticModel.ts`. Two invariants:
 *
 *   1. The vector NEVER contains null / undefined / NaN. Every nullish input
 *      from the calc layer maps to an explicit numeric encoding documented
 *      in the FeatureVector type below.
 *   2. Key order in FeatureVector MUST match the order of WEIGHTS in
 *      logisticModel.ts. A unit test pins both length and order so a future
 *      change can't silently rotate the weights.
 */

import type {
  AimsRiskBand,
  CompositeBand,
  F8Result,
  F9Result,
  F10Result,
  F11Result,
  StudentBriefingInput,
  TrajectoryDirection,
} from "@/lib/calculations/types";
import type { F1Result } from "@/lib/calculations/f1";
import type { F3Result } from "@/lib/calculations/f3";
import type { F4Result } from "@/lib/calculations/f4";
import type { F6Result } from "@/lib/calculations/f6";
import type { F7Result } from "@/lib/calculations/f7";

/**
 * The order of these keys is the contract with logisticModel WEIGHTS.
 * Adding a new feature requires (a) appending here and (b) appending the
 * matching weight at the same index in WEIGHTS, plus a model_version bump.
 */
export interface FeatureVector {
  // F1 — A-G
  ag_completion_pct: number; // 0.0 – 1.0
  ag_gpa: number; // 0.0 – 4.0
  ag_deficit_count: number; // integer ≥ 0

  // F3/F6 — NCAA core completion
  ncaa_d1_completion_pct: number;
  ncaa_d2_completion_pct: number;
  ncaa_core_gpa: number;

  // F4/F7 — GPA qualifier bands (ordinal: nonqualifier=0, partial=1, qualifier=2)
  ncaa_d1_gpa_band: 0 | 1 | 2;
  ncaa_d2_gpa_band: 0 | 1 | 2;

  // F5 — lock-in
  /** No lock-in concern is encoded as 99 — the model treats this as "far from risk". */
  weeks_to_lock_in: number;

  // F8 — composite band ordinal (GREEN=0, YELLOW=1, RED=2, ESCALATED=3)
  composite_band_ordinal: 0 | 1 | 2 | 3;

  // F9 — trajectory
  /** declining=-1, flat_or_uncertain=0, improving=1, insufficient=0. */
  gpa_trajectory_direction: -1 | 0 | 1;
  /** OLS slope. null encoded as 0. */
  gpa_slope: number;
  regression_flag: 0 | 1;
  plateau_flag: 0 | 1;

  // F10 — AIMS
  /** Insufficient/Low=0, Moderate=1, High=2. */
  aims_risk_ordinal: 0 | 1 | 2;
  /** within_subject_delta_pct. null encoded as 0. */
  aims_delta_pct: number;

  // F11 — engagement
  /** null encoded as 0.5 (neutral midpoint). */
  engagement_window_avg: number;
  withdrawal_flag: 0 | 1;
  low_engagement_flag: 0 | 1;
  consecutive_absences: number;

  // Metadata derived from the student record
  weeks_to_graduation: number;
  division_intent_d1: 0 | 1;
  division_intent_d2: 0 | 1;
}

/**
 * Number of feature values (excluding the model intercept). Pinned by tests.
 *
 * Note: the Sprint 7 spec text says "Feature count: 22" but the
 * FeatureVector type definition and the WEIGHTS array both list 23
 * features (the 22 vs 23 line item is `weeks_to_lock_in`). We match the
 * structural definition because that's what the WEIGHTS array assumes.
 */
export const FEATURE_COUNT = 23;

/* -------------------------------------------------------------------------- */
/* Encoders                                                                    */
/* -------------------------------------------------------------------------- */

const COMPOSITE_BAND_RANK: Record<CompositeBand, 0 | 1 | 2 | 3> = {
  GREEN: 0,
  YELLOW: 1,
  RED: 2,
  ESCALATED: 3,
};

function encodeTrajectoryDirection(
  dir: TrajectoryDirection | null | undefined
): -1 | 0 | 1 {
  if (dir === "improving") return 1;
  if (dir === "declining") return -1;
  return 0;
}

function encodeAimsRisk(band: AimsRiskBand | null | undefined): 0 | 1 | 2 {
  if (band === "High") return 2;
  if (band === "Moderate") return 1;
  return 0;
}

function encodeQualifierBand(status: string | null | undefined): 0 | 1 | 2 {
  if (status === "FULL_QUALIFIER") return 2;
  if (status === "PARTIAL_QUALIFIER" || status === "ACADEMIC_REDSHIRT") return 1;
  return 0;
}

function encodeFlag(value: boolean | null | undefined): 0 | 1 {
  return value ? 1 : 0;
}

function safeNumber(value: number | null | undefined, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return value;
}

function weeksToLockIn(f8: F8Result, fallback = 99): number {
  // F8 doesn't expose weeks-to-lock directly; we infer from the composite
  // band so the feature stays a "distance" rather than a duplicate of the
  // composite ordinal. ESCALATED → 0, RED → 2, YELLOW → 8, GREEN → 99.
  switch (f8.composite_band) {
    case "ESCALATED":
      return 0;
    case "RED":
      return 2;
    case "YELLOW":
      return 8;
    case "GREEN":
      return fallback;
    default:
      return fallback;
  }
}

function weeksToGraduation(student: StudentBriefingInput): number {
  // Approximate: graduation = enrollment_grade_9 + 4 academic years anchored at
  // June. We don't store grad date directly; this tracks the spec's intent.
  const reference = student.referenceDate;
  // graduation_year is on the briefing input; a June 1 graduation gives us a
  // stable target whose precision is sufficient for a coarse weekly feature.
  const gradYear = student.graduation_year;
  const gradDate = new Date(`${gradYear}-06-01T00:00:00Z`);
  const diffMs = gradDate.getTime() - reference.getTime();
  if (!Number.isFinite(diffMs)) return 0;
  const weeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, weeks);
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export function extractFeatureVector(
  student: StudentBriefingInput,
  f1: F1Result,
  f3: F3Result,
  f4: F4Result,
  f6: F6Result,
  f7: F7Result,
  f8: F8Result,
  f9: F9Result,
  f10: F10Result,
  f11: F11Result
): FeatureVector {
  const divisionIntents = (student.division_intent ?? []).map((d) => d.toUpperCase());
  const wantsD1 =
    divisionIntents.includes("DI") ||
    divisionIntents.includes("DI_OR_DII_UNDECIDED");
  const wantsD2 =
    divisionIntents.includes("DII") ||
    divisionIntents.includes("DI_OR_DII_UNDECIDED");

  const agDeficitCount = Object.values(f1.perCategory).filter(
    (cat) => !cat.complete
  ).length;

  const vector: FeatureVector = {
    ag_completion_pct: safeNumber(f1.completionPct, 0) / 100,
    ag_gpa: safeNumber(
      // F2 produces the A-G GPA; we don't get F2 in this signature so we
      // fall back to the unweighted core GPA (a reasonable proxy because A-G
      // and NCAA cores overlap heavily for D1 athletes). When F2 is wired
      // through this caller we'll switch over without a model bump because
      // the encoding domain stays 0–4.
      f4.coreGpaUnweighted,
      0
    ),
    ag_deficit_count: agDeficitCount,

    ncaa_d1_completion_pct:
      f3.applicable && f3.totalRequired > 0
        ? safeNumber(f3.totalCompleted, 0) / f3.totalRequired
        : 0,
    ncaa_d2_completion_pct: f6.totalRequired
      ? safeNumber(f6.totalCompleted, 0) / f6.totalRequired
      : 0,
    ncaa_core_gpa: safeNumber(f4.coreGpaUnweighted, 0),

    ncaa_d1_gpa_band: encodeQualifierBand(f4.qualifierStatus),
    ncaa_d2_gpa_band: encodeQualifierBand(f7.qualifierStatus),

    weeks_to_lock_in: weeksToLockIn(f8),

    composite_band_ordinal: COMPOSITE_BAND_RANK[f8.composite_band] ?? 0,

    gpa_trajectory_direction: encodeTrajectoryDirection(f9.direction),
    gpa_slope: safeNumber(f9.slope, 0),
    regression_flag: encodeFlag(f9.regression_flag),
    plateau_flag: encodeFlag(f9.plateau_flag),

    aims_risk_ordinal: encodeAimsRisk(f10.risk_band),
    aims_delta_pct: safeNumber(f10.within_subject_delta_pct, 0),

    engagement_window_avg: safeNumber(f11.window_avg, 0.5),
    withdrawal_flag: encodeFlag(f11.withdrawal_flag),
    low_engagement_flag: encodeFlag(f11.low_engagement_flag),
    consecutive_absences: safeNumber(f11.consecutive_absences, 0),

    weeks_to_graduation: weeksToGraduation(student),
    division_intent_d1: wantsD1 ? 1 : 0,
    division_intent_d2: wantsD2 ? 1 : 0,
  };

  return vector;
}

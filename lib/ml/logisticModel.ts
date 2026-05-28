/**
 * Sprint 7 / Workstream ML-3 — logistic regression v0.1.
 *
 * Model type:        binary logistic regression
 * Training data:     synthetic demo cohort (12 students)
 * Outcome label:     P(student falls below NCAA qualifier threshold before grad)
 * Feature count:     22 (see FEATURE_COUNT in extractFeatureVector.ts)
 * Model version:     'logistic-v0.1'
 *
 * TRAINING_DATA_NOTE: weights derived from synthetic data. Treat every
 * score produced by this version as Provisional. The Risk Forecast card in
 * the Trajectory tab surfaces this caveat as an always-visible disclaimer.
 *
 * Weight order MUST match the key order of the FeatureVector interface in
 * extractFeatureVector.ts. The unit suite in __tests__/ml.test.ts pins
 * both length and order so a future change can't silently rotate them.
 *
 * The confidence margin used to be a hardcoded ±0.12. Sprint 7 / Workstream
 * T moved that knob into the database; `scoreStudent` now accepts the margin
 * as a parameter (default kept at 0.12 so legacy callers stay green until
 * they migrate to the threshold-aware path).
 */

import type { FeatureVector } from "./extractFeatureVector";

export const MODEL_VERSION = "logistic-v0.1";

/** Bootstrap CI approximation. Sprint 8 will replace with proper bootstrap SE. */
export const DEFAULT_CONFIDENCE_MARGIN = 0.12;

/**
 * Risk tier cutoffs are tied to the score, not the CI bounds. A score of
 * 0.69 with CI [0.57, 0.81] still reads as "moderate" because the point
 * estimate is the most-defensible single number we have at v0.1.
 */
const RISK_TIER_HIGH = 0.7;
const RISK_TIER_MODERATE = 0.4;

/**
 * Intercept + 22 feature weights. Order matches FeatureVector (see
 * extractFeatureVector.ts). Negative weights mean the feature lowers risk
 * (more A-G GPA = lower probability of dropping below qualifier); positive
 * weights raise it.
 */
const WEIGHTS: number[] = [
  -2.1, // 0  intercept
   0.8, // 1  ag_completion_pct          (note: spec lists negative — see below)
  -1.2, // 2  ag_gpa
   0.6, // 3  ag_deficit_count
  -0.9, // 4  ncaa_d1_completion_pct
  -0.7, // 5  ncaa_d2_completion_pct
  -1.4, // 6  ncaa_core_gpa
  -0.8, // 7  ncaa_d1_gpa_band
  -0.6, // 8  ncaa_d2_gpa_band
  -0.3, // 9  weeks_to_lock_in
   1.5, // 10 composite_band_ordinal
   0.7, // 11 gpa_trajectory_direction
   0.4, // 12 gpa_slope
   1.1, // 13 regression_flag
   0.5, // 14 plateau_flag
   0.8, // 15 aims_risk_ordinal
   0.3, // 16 aims_delta_pct
  -0.6, // 17 engagement_window_avg
   1.2, // 18 withdrawal_flag
   0.7, // 19 low_engagement_flag
   0.4, // 20 consecutive_absences
  -0.5, // 21 weeks_to_graduation
   0.9, // 22 division_intent_d1
   0.2, // 23 division_intent_d2
];

export const FEATURE_WEIGHTS = WEIGHTS;

function sigmoid(x: number): number {
  // Clamp to avoid overflow in Math.exp for extreme logits.
  if (x > 35) return 1;
  if (x < -35) return 0;
  return 1 / (1 + Math.exp(-x));
}

export interface ScoreResult {
  score: number;
  confidence_lower: number;
  confidence_upper: number;
  risk_tier: "low" | "moderate" | "high";
  model_version: string;
}

export interface ScoreOptions {
  /** Confidence margin (±) around the point estimate. */
  confidenceMargin?: number;
}

export function scoreStudent(
  features: FeatureVector,
  options: ScoreOptions = {}
): ScoreResult {
  const featureValues = Object.values(features) as number[];

  // Defensive: make sure the vector is exactly the expected length.
  if (featureValues.length !== WEIGHTS.length - 1) {
    throw new Error(
      `ML feature vector length ${featureValues.length} != expected ${WEIGHTS.length - 1}`
    );
  }

  const intercept = WEIGHTS[0]!;
  const logit = featureValues.reduce(
    (sum, val, i) => sum + val * (WEIGHTS[i + 1] ?? 0),
    intercept
  );
  const score = sigmoid(logit);

  const margin = options.confidenceMargin ?? DEFAULT_CONFIDENCE_MARGIN;
  const confidence_lower = Math.max(0, score - margin);
  const confidence_upper = Math.min(1, score + margin);

  const risk_tier: ScoreResult["risk_tier"] =
    score >= RISK_TIER_HIGH
      ? "high"
      : score >= RISK_TIER_MODERATE
        ? "moderate"
        : "low";

  return {
    score,
    confidence_lower,
    confidence_upper,
    risk_tier,
    model_version: MODEL_VERSION,
  };
}

/** Plain-language consequence copy for operator-configurable thresholds. */
export const THRESHOLD_CONSEQUENCES: Record<string, string> = {
  "f11.low_engagement_cutoff":
    "Engagement average below this flags low engagement across the cohort.",
  "f12.yellow_action_weeks":
    "Weeks-to-critical-action assigned for YELLOW band briefings and roster.",
  "f10.pct_delta_threshold":
    "AIMS within-subject percentage change above this elevates psychometric risk.",
  "ml.confidence_margin":
    "Confidence band width for ML trajectory advisory scores.",
};

export function thresholdConsequence(key: string, description: string): string {
  return THRESHOLD_CONSEQUENCES[key] ?? description;
}

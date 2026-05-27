import type { EngagementType, F11Result } from "./types";

export type EngagementObservationInput = {
  observed_at: Date;
  engagement_type: EngagementType;
  value: number;
  data_source_class: "A" | "B" | "C";
};

const DAY_MS = 24 * 60 * 60 * 1000;

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calcEngagementMetrics(
  observations: EngagementObservationInput[],
  referenceDate: Date = new Date()
): F11Result {
  const windowStart = new Date(referenceDate.getTime() - 28 * DAY_MS);
  const midpoint = new Date(referenceDate.getTime() - 14 * DAY_MS);
  const windowed = observations
    .filter((row) => row.observed_at >= windowStart && row.observed_at <= referenceDate)
    .sort((a, b) => a.observed_at.getTime() - b.observed_at.getTime());

  const data_class_effective = windowed.some(
    (row) => row.data_source_class === "A" || row.data_source_class === "B"
  )
    ? "A"
    : "C";

  const practiceRows = windowed.filter((row) => row.engagement_type === "practice_attendance");
  let consecutive_absences = 0;
  for (let i = practiceRows.length - 1; i >= 0; i -= 1) {
    if (practiceRows[i]!.value === 0) {
      consecutive_absences += 1;
      continue;
    }
    break;
  }

  const withdrawal_flag = consecutive_absences >= 3;

  if (windowed.length < 3) {
    return {
      window_avg: null,
      trend: "insufficient",
      consecutive_absences,
      low_engagement_flag: false,
      withdrawal_flag,
      data_class_effective,
      evidence_tier: "Insufficient",
      insufficient_reason: "below_minimum_observations",
    };
  }

  const values = windowed.map((row) => row.value);
  const window_avg = mean(values);
  const firstHalf = windowed
    .filter((row) => row.observed_at < midpoint)
    .map((row) => row.value);
  const secondHalf = windowed
    .filter((row) => row.observed_at >= midpoint)
    .map((row) => row.value);

  const firstHalfMean = mean(firstHalf);
  const secondHalfMean = mean(secondHalf);

  let trend: F11Result["trend"] = "insufficient";
  if (firstHalfMean !== null && secondHalfMean !== null) {
    const delta = secondHalfMean - firstHalfMean;
    if (delta > 0.1) trend = "rising";
    else if (delta < -0.1) trend = "declining";
    else trend = "stable";
  }

  // THRESHOLD_PENDING_D5: 0.40 low-engagement cutoff — placeholder pending D5 normative calibration
  const low_engagement_flag = window_avg !== null && window_avg < 0.4;

  return {
    window_avg,
    trend,
    consecutive_absences,
    low_engagement_flag,
    withdrawal_flag,
    data_class_effective,
    evidence_tier: data_class_effective === "A" ? "Provisional" : "Strong",
    insufficient_reason: null,
  };
}

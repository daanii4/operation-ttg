import { gradeToPoints, stripPlusMinus } from "./course-utils";
import type { F9Result } from "./types";

export type GradeUpdateInput = {
  observed_grade: string;
  observed_at: Date;
  data_source_class: "A" | "B" | "C";
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDays(date: Date, start: Date): number {
  return (date.getTime() - start.getTime()) / DAY_MS;
}

function computeSlope(xs: number[], ys: number[]): { slope: number | null; intercept: number | null; sxx: number } {
  const n = xs.length;
  if (n < 2) return { slope: null, intercept: null, sxx: 0 };
  const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;
  const sxx = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  if (sxx === 0) return { slope: 0, intercept: meanY, sxx };
  const sxy = xs.reduce((sum, x, index) => sum + (x - meanX) * (ys[index]! - meanY), 0);
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  return { slope, intercept, sxx };
}

export function calcGpaTrajectory(
  gradeUpdates: GradeUpdateInput[],
  referenceDate: Date = new Date()
): F9Result {
  const windowStart = new Date(referenceDate.getTime() - 63 * DAY_MS);
  const windowed = gradeUpdates
    .filter((row) => row.observed_at >= windowStart && row.observed_at <= referenceDate)
    .map((row) => ({
      ...row,
      points: gradeToPoints(stripPlusMinus(row.observed_grade)),
    }))
    .filter((row) => row.points !== null)
    .sort((a, b) => a.observed_at.getTime() - b.observed_at.getTime());

  const data_class_effective = windowed.some(
    (row) => row.data_source_class === "A" || row.data_source_class === "B"
  )
    ? "A"
    : "C";

  if (windowed.length === 0) {
    return {
      slope: null,
      confidence_interval: null,
      direction: null,
      regression_flag: false,
      plateau_flag: false,
      data_class_effective,
      evidence_tier: "Insufficient",
      insufficient_reason: "below_minimum_observations",
    };
  }

  const firstDate = windowed[0]!.observed_at;
  const xs = windowed.map((row) => toDays(row.observed_at, firstDate));
  const ys = windowed.map((row) => row.points as number);

  const spanDays = windowed.length >= 2 ? toDays(windowed[windowed.length - 1]!.observed_at, firstDate) : 0;
  const meetsMinimum = windowed.length >= 3 && spanDays >= 28;

  const { slope, intercept, sxx } = computeSlope(xs, ys);
  let confidence_interval: [number, number] | null = null;

  if (slope !== null && intercept !== null && windowed.length >= 3 && sxx > 0) {
    const residuals = ys.map((y, index) => y - (intercept + slope * xs[index]!));
    const sse = residuals.reduce((sum, value) => sum + value * value, 0);
    const se = Math.sqrt((sse / (windowed.length - 2)) / sxx);
    confidence_interval = [slope - 1.96 * se, slope + 1.96 * se];
  }

  let direction: F9Result["direction"] = null;
  if (slope !== null) {
    if (confidence_interval && confidence_interval[0] < 0 && confidence_interval[1] > 0) {
      direction = "flat_or_uncertain";
    } else if (confidence_interval) {
      direction = slope > 0 ? "improving" : slope < 0 ? "declining" : "flat_or_uncertain";
    } else {
      direction = slope > 0 ? "improving" : slope < 0 ? "declining" : "flat_or_uncertain";
    }
  }

  let plateau_flag = false;
  let streak = 1;
  for (let i = 1; i < ys.length; i += 1) {
    if (ys[i] === ys[i - 1]) {
      streak += 1;
      if (streak >= 3) {
        plateau_flag = true;
      }
    } else {
      streak = 1;
    }
  }

  const firstPoints = ys[0] ?? null;
  const lastPoints = ys[ys.length - 1] ?? null;
  const declinePct =
    firstPoints !== null && firstPoints > 0 && lastPoints !== null
      ? (firstPoints - lastPoints) / firstPoints
      : 0;

  const regression_flag =
    meetsMinimum && direction === "declining" && declinePct >= 0.25;

  if (!meetsMinimum) {
    return {
      slope,
      confidence_interval,
      direction,
      regression_flag: false,
      plateau_flag,
      data_class_effective,
      evidence_tier: "Insufficient",
      insufficient_reason: "below_minimum_observations",
    };
  }

  return {
    slope,
    confidence_interval,
    direction,
    regression_flag,
    plateau_flag,
    data_class_effective,
    evidence_tier: data_class_effective === "A" ? "Provisional" : "Strong",
    insufficient_reason: null,
  };
}

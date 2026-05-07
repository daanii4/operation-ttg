import type { RiskBand } from "./f5";
import type { AimsRisk, FrameworkBand, GpaTrajectory, HolisticProfile } from "@/lib/seed/holistic-data";

export type OverallRisk = "CRITICAL" | "AT_RISK" | "STABLE" | "ON_TRACK";

export type HolisticStudentRisk = HolisticProfile & {
  tenSevenStatus: RiskBand | "NOT_APPLICABLE";
  overallRisk: OverallRisk;
};

export type HolisticSummary = {
  tenSeven: Record<"GREEN" | "YELLOW" | "RED" | "LOCKED", number>;
  ag: Record<FrameworkBand, number>;
  gpa: Record<GpaTrajectory, number>;
  aims: Record<AimsRisk, number>;
  overall: Record<OverallRisk, number>;
};

const OVERALL_EMPTY: Record<OverallRisk, number> = {
  CRITICAL: 0,
  AT_RISK: 0,
  STABLE: 0,
  ON_TRACK: 0,
};

export function computeOverallRisk(input: {
  tenSevenStatus: RiskBand | "NOT_APPLICABLE";
  agStatus: FrameworkBand;
  gpaTrajectory: GpaTrajectory;
  aimsRisk: AimsRisk;
}): OverallRisk {
  if (input.aimsRisk === "HIGH" || input.tenSevenStatus === "LOCKED" || input.agStatus === "RED") {
    return "CRITICAL";
  }

  if (
    input.aimsRisk === "ESCALATED" ||
    input.tenSevenStatus === "RED" ||
    input.tenSevenStatus === "YELLOW" ||
    input.agStatus === "YELLOW" ||
    input.gpaTrajectory === "declining"
  ) {
    return "AT_RISK";
  }

  if (input.gpaTrajectory === "flat") {
    return "STABLE";
  }

  return "ON_TRACK";
}

export function attachOverallRisk(
  profile: HolisticProfile,
  tenSevenStatus: RiskBand | "NOT_APPLICABLE"
): HolisticStudentRisk {
  return {
    ...profile,
    tenSevenStatus,
    overallRisk: computeOverallRisk({
      tenSevenStatus,
      agStatus: profile.agStatus,
      gpaTrajectory: profile.gpaTrajectory,
      aimsRisk: profile.aimsRisk,
    }),
  };
}

export function computeFrameworkSummary(rows: HolisticStudentRisk[]): HolisticSummary {
  const summary: HolisticSummary = {
    tenSeven: { GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    ag: { GREEN: 0, YELLOW: 0, RED: 0 },
    gpa: { improving: 0, flat: 0, declining: 0 },
    aims: { STABLE: 0, ESCALATED: 0, HIGH: 0 },
    overall: { ...OVERALL_EMPTY },
  };

  for (const row of rows) {
    if (row.tenSevenStatus !== "NOT_APPLICABLE") {
      summary.tenSeven[row.tenSevenStatus]++;
    }
    summary.ag[row.agStatus]++;
    summary.gpa[row.gpaTrajectory]++;
    summary.aims[row.aimsRisk]++;
    summary.overall[row.overallRisk]++;
  }

  return summary;
}

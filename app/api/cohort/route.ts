/**
 * GET /api/cohort
 *
 * Returns pre-computed F5 results for all demo students.
 * Chart series data computed server-side (never on client).
 * No auth required for demo; production would require session check.
 */

import { NextResponse } from "next/server";
import { handleAuthError } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { computeAllDemoResults, DEMO_TODAY } from "@/lib/seed/demo-data";
import type { RiskBand } from "@/lib/calculations/f5";
import { getHolisticProfile } from "@/lib/seed/holistic-data";
import type { AimsRisk, FrameworkBand, GpaTrajectory } from "@/lib/seed/holistic-data";
import {
  attachOverallRisk,
  computeFrameworkSummary,
  type HolisticStudentRisk,
  type HolisticSummary,
  type OverallRisk,
} from "@/lib/calculations/holistic-rollup";
import { MUSD_COHORT_DEADLINES } from "@/lib/seed/deadlines";
import {
  computeApproachingDeadlines,
  type ApproachingDeadline,
} from "@/lib/calculations/approaching-deadlines";
import {
  computeNcaaReadinessSummary,
  type NcaaReadinessSummary,
} from "@/lib/eligibility/ncaa-readiness";

export interface CohortStudentRow {
  studentId: string;
  highSchoolId: string;
  firstName: string;
  lastName: string;
  sport: string;
  grade: number;
  highSchoolName: string;
  targetDivision: string;
  riskBand: RiskBand | "NOT_APPLICABLE";
  daysToLock: number | null;
  completedTotal: number;
  missingTotal: number;
  completedEngMathSci: number;
  missingEngMathSci: number;
  provisionalFlag: boolean;
  evidenceTier: string;
  agDualFlagCount: number;
  lockInDate: string | null;
  lockInDateBasis: string | null;
  overallRisk: OverallRisk;
  agStatus: FrameworkBand;
  agMissingCount: number;
  projectedCoreGpa: number;
  gpaTrajectory: GpaTrajectory;
  aimsRisk: AimsRisk;
  aimsReason: string | null;
  recommendedAdvisorAction: string;
}

export interface BandCount {
  band: string;
  count: number;
}

export interface LockBucket {
  label: string;
  daysMin: number;
  daysMax: number;
  GREEN: number;
  YELLOW: number;
  RED: number;
  LOCKED: number;
}

export interface CohortApiResponse {
  computedAt: string;
  totalStudents: number;
  bandSummary: Record<string, number>;
  /** Server-computed chart series for Recharts — x-axis: bucket label, y-axis: counts */
  lockDistributionSeries: LockBucket[];
  students: CohortStudentRow[];
  holisticSummary: HolisticSummary;
  holisticRows: HolisticStudentRisk[];
  approachingDeadlines: ApproachingDeadline[];
  ncaaReadiness: NcaaReadinessSummary;
}

export async function GET(): Promise<NextResponse<CohortApiResponse>> {
  const allResults = computeAllDemoResults();

  // ── Band summary (for headline counts) ──────────────────────────────────
  const bandSummary: Record<string, number> = {
    GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0, NOT_APPLICABLE: 0,
  };
  for (const r of allResults) {
    const band = r.f5.applicable ? r.f5.riskBand : "NOT_APPLICABLE";
    bandSummary[band] = (bandSummary[band] ?? 0) + 1;
  }

  // ── Lock distribution chart series (server-computed) ──────────────────
  // Buckets: LOCKED (past), 0–90d, 91–180d, 181–365d, 365d+
  const buckets: LockBucket[] = [
    { label: "LOCKED", daysMin: -Infinity, daysMax: 0, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "0–90 days", daysMin: 0, daysMax: 90, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "91–180 days", daysMin: 91, daysMax: 180, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "181–365 days", daysMin: 181, daysMax: 365, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "365+ days", daysMin: 366, daysMax: Infinity, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
  ];

  for (const r of allResults) {
    if (!r.f5.applicable) continue;
    const band = r.f5.riskBand as keyof Omit<LockBucket, "label" | "daysMin" | "daysMax">;
    if (r.f5.pastLock) {
      buckets[0][band]++;
    } else {
      const days = r.f5.daysToLock ?? 0;
      const bucket = buckets.find(
        (b) => b.daysMin !== -Infinity && days >= b.daysMin && days <= b.daysMax
      );
      if (bucket) bucket[band]++;
    }
  }

  const holisticRows: HolisticStudentRisk[] = allResults.map((r) =>
    attachOverallRisk(
      getHolisticProfile(r.studentId),
      r.f5.applicable ? r.f5.riskBand : "NOT_APPLICABLE"
    )
  );
  const holisticById = new Map(holisticRows.map((row) => [row.studentId, row]));

  // ── Student rows for cohort table ────────────────────────────────────
  const students: CohortStudentRow[] = allResults.map((r) => {
    const holistic = holisticById.get(r.studentId)!;
    return {
      studentId: r.studentId,
      highSchoolId: r.highSchoolId,
      firstName: r.firstName,
      lastName: r.lastName,
      sport: r.sport,
      grade: r.grade,
      highSchoolName: r.highSchoolName,
      targetDivision: r.targetDivision,
      riskBand: r.f5.applicable ? r.f5.riskBand : ("NOT_APPLICABLE" as const),
      daysToLock: r.f5.daysToLock,
      completedTotal: r.f5.completedTotal,
      missingTotal: r.f5.missingTotal,
      completedEngMathSci: r.f5.completedEngMathSci,
      missingEngMathSci: r.f5.missingEngMathSci,
      provisionalFlag: r.f5.provisionalFlag,
      evidenceTier: r.f5.evidenceTier,
      agDualFlagCount: r.f5.agFailureDualFlags.length,
      lockInDate: r.f5.lockInDate?.toISOString().split("T")[0] ?? null,
      lockInDateBasis: r.f5.lockInDateBasis,
      overallRisk: holistic.overallRisk,
      agStatus: holistic.agStatus,
      agMissingCount: holistic.agMissingCount,
      projectedCoreGpa: holistic.projectedCoreGpa,
      gpaTrajectory: holistic.gpaTrajectory,
      aimsRisk: holistic.aimsRisk,
      aimsReason: holistic.aimsReason,
      recommendedAdvisorAction: holistic.recommendedAdvisorAction,
    };
  });

  const holisticSummary = computeFrameworkSummary(holisticRows);
  const approachingDeadlines = computeApproachingDeadlines({
    today: DEMO_TODAY,
    students,
    holisticRows,
    deadlines: MUSD_COHORT_DEADLINES,
  });
  const ncaaReadiness = await computeNcaaReadinessSummary(
    students.map((student) => ({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      sport: student.sport,
      grade: student.grade,
      targetDivision: student.targetDivision,
      highSchoolName: student.highSchoolName,
      highSchoolId: student.highSchoolId,
    }))
  );

  return NextResponse.json({
    computedAt: DEMO_TODAY.toISOString(),
    totalStudents: allResults.length,
    bandSummary,
    lockDistributionSeries: buckets,
    students,
    holisticSummary,
    holisticRows,
    approachingDeadlines,
    ncaaReadiness,
  });
}

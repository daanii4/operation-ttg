import type { Metadata } from "next";
import type { CohortApiResponse } from "@/app/api/cohort/route";
import DashboardShell from "@/components/layout/DashboardShell";
import TtgHeaderActions from "@/components/layout/TtgHeaderActions";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CohortClient from "./CohortClient";
import { getHolisticProfile } from "@/lib/seed/holistic-data";
import {
  attachOverallRisk,
  computeFrameworkSummary,
  type HolisticStudentRisk,
} from "@/lib/calculations/holistic-rollup";
import { MUSD_COHORT_DEADLINES } from "@/lib/seed/deadlines";
import { computeApproachingDeadlines } from "@/lib/calculations/approaching-deadlines";
import { computeNcaaReadinessSummary } from "@/lib/eligibility/ncaa-readiness";

export const metadata: Metadata = {
  title: "Cohort Dashboard · Operation TTG",
};

async function getCohortData(): Promise<CohortApiResponse> {
  const { computeAllDemoResults, DEMO_TODAY } = await import("@/lib/seed/demo-data");
  const allResults = computeAllDemoResults();

  const bandSummary: Record<string, number> = {
    GREEN: 0,
    YELLOW: 0,
    RED: 0,
    LOCKED: 0,
    NOT_APPLICABLE: 0,
  };
  for (const r of allResults) {
    const band = r.f5.applicable ? r.f5.riskBand : "NOT_APPLICABLE";
    bandSummary[band] = (bandSummary[band] ?? 0) + 1;
  }

  const buckets = [
    { label: "LOCKED",       daysMin: -Infinity, daysMax: 0,        GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "0–90 days",    daysMin: 0,         daysMax: 90,       GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "91–180 days",  daysMin: 91,        daysMax: 180,      GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "181–365 days", daysMin: 181,       daysMax: 365,      GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "365+ days",    daysMin: 366,       daysMax: Infinity, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
  ];

  for (const r of allResults) {
    if (!r.f5.applicable) continue;
    const band = r.f5.riskBand as "GREEN" | "YELLOW" | "RED" | "LOCKED";
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

  const students = allResults.map((r) => {
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

  return {
    computedAt: DEMO_TODAY.toISOString(),
    totalStudents: allResults.length,
    bandSummary,
    lockDistributionSeries: buckets,
    students,
    holisticSummary,
    holisticRows,
    approachingDeadlines,
    ncaaReadiness,
  };
}

export default async function AnalyticsPage() {
  const data = await getCohortData();
  const computedDate = new Date(data.computedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardShell
      eyebrow="OVERVIEW"
      pageTitle="Cohort Analytics"
      pageSubtitle={`${data.totalStudents} student-athletes · Computed ${computedDate} · Evidence tier deterministic`}
      headerActions={<TtgHeaderActions />}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard/analytics" },
          { label: "Cohort Analytics" },
        ]}
      />
      <CohortClient data={data} />
    </DashboardShell>
  );
}

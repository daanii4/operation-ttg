import type { StudentAthlete, CourseRecord, HighSchool } from "@prisma/client";
import type { RiskBand } from "@/lib/calculations/f5";
import { calcNcaa107Status, type F5CourseRecord, type F5SchoolCalendar } from "@/lib/calculations/f5";
import {
  attachOverallRisk,
  computeFrameworkSummary,
  type HolisticStudentRisk,
  type HolisticSummary,
  type OverallRisk,
} from "@/lib/calculations/holistic-rollup";
import {
  computeApproachingDeadlines,
  type ApproachingDeadline,
} from "@/lib/calculations/approaching-deadlines";
import {
  computeNcaaReadinessSummary,
  type NcaaReadinessSummary,
} from "@/lib/eligibility/ncaa-readiness";
import { prismaTtg } from "@/lib/prisma";
import { MUSD_COHORT_DEADLINES } from "@/lib/seed/deadlines";
import { computeAllDemoResults, DEMO_TODAY, STUDENT_NAMES } from "@/lib/seed/demo-data";
import { getHolisticProfile, type AimsRisk, type FrameworkBand, type GpaTrajectory } from "@/lib/seed/holistic-data";
import { getTtgSession } from "@/lib/auth/session";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getStudentScope } from "@/lib/auth/student-scope";

type DemoResult = ReturnType<typeof computeAllDemoResults>[number];

type CohortResultRow = DemoResult;

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
  lockDistributionSeries: LockBucket[];
  students: CohortStudentRow[];
  holisticSummary: HolisticSummary;
  holisticRows: HolisticStudentRisk[];
  approachingDeadlines: ApproachingDeadline[];
  ncaaReadiness: NcaaReadinessSummary;
}

type DbStudent = StudentAthlete & {
  courses: CourseRecord[];
  highSchool: HighSchool | null;
};

function mapCourseRecordToF5(course: CourseRecord): F5CourseRecord {
  return {
    id: course.id,
    courseName: course.courseName,
    gradeLetterNormalized: course.gradeLetterNormalized,
    termEndDate: course.termEndDate,
    ncaaD1Category: course.ncaaD1Category,
    ncaaApproved: course.ncaaApproved,
    agCategory: course.agCategory,
    classificationUpdatedAt: course.classificationUpdatedAt,
  };
}

function mapHighSchoolToCalendar(highSchool: HighSchool | null): F5SchoolCalendar | null {
  if (!highSchool?.seniorFallTermStart) {
    return null;
  }

  return {
    seniorFallTermStart: highSchool.seniorFallTermStart,
    summerTermEndDate: highSchool.summerTermEnd ?? undefined,
    maxCoresPerTerm: highSchool.maxCoresPerTerm,
    maxEmsPerTerm: highSchool.maxEmsPerTerm,
    calendarSourceUrl: highSchool.calendarSourceUrl,
  };
}

async function getDbCohortResults(): Promise<CohortResultRow[]> {
  const session = await getTtgSession();

  // Multi-advisor scoping (Sprint 6 / Workstream C):
  //   • owner  / viewer → see the full cohort.
  //   • advisor          → only their assigned students (empty when none).
  // For anonymous / unrecognised sessions we fall back to the legacy
  // single-advisor behaviour so existing demo flows stay green.
  let where: Record<string, unknown> | undefined;
  if (session && session.userId !== "anonymous") {
    const profile = await ensureAdvisorProfile(session).catch(() => null);
    where = await getStudentScope(session.userId, profile?.teamRole ?? null).catch(
      () => ({ advisorId: session.userId })
    );
  }

  const dbStudents = await prismaTtg.studentAthlete.findMany({
    where,
    include: {
      courses: true,
      highSchool: true,
    },
  });

  if (dbStudents.length === 0) {
    return [];
  }

  const today = new Date();
  return dbStudents.map((student: DbStudent) => {
    const courses = student.courses.map(mapCourseRecordToF5);
    const calendar = mapHighSchoolToCalendar(student.highSchool);
    const f5 = calcNcaa107Status(
      {
        id: student.id,
        targetDivision: student.targetDivision,
        enrollmentDateGrade9: student.enrollmentDateGrade9,
        highSchoolId: student.highSchoolId,
        highSchoolName: student.highSchoolName ?? student.highSchool?.schoolName ?? "Unknown High School",
        grade: student.grade,
      },
      courses,
      calendar,
      today
    );
    const seedName = STUDENT_NAMES[student.id];

    return {
      studentId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      sport: seedName?.sport ?? "Unknown",
      grade: student.grade,
      highSchoolId: student.highSchoolId,
      highSchoolName: student.highSchoolName ?? student.highSchool?.schoolName ?? "Unknown High School",
      targetDivision: student.targetDivision,
      courses,
      f5,
    };
  });
}

function buildResponseFromResults(allResults: CohortResultRow[], computedAt: Date): Omit<CohortApiResponse, "ncaaReadiness"> {
  const bandSummary: Record<string, number> = {
    GREEN: 0,
    YELLOW: 0,
    RED: 0,
    LOCKED: 0,
    NOT_APPLICABLE: 0,
  };
  for (const result of allResults) {
    const band = result.f5.applicable ? result.f5.riskBand : "NOT_APPLICABLE";
    bandSummary[band] = (bandSummary[band] ?? 0) + 1;
  }

  const buckets: LockBucket[] = [
    { label: "LOCKED", daysMin: -Infinity, daysMax: 0, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "0–90 days", daysMin: 0, daysMax: 90, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "91–180 days", daysMin: 91, daysMax: 180, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "181–365 days", daysMin: 181, daysMax: 365, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
    { label: "365+ days", daysMin: 366, daysMax: Infinity, GREEN: 0, YELLOW: 0, RED: 0, LOCKED: 0 },
  ];

  for (const result of allResults) {
    if (!result.f5.applicable) continue;
    const band = result.f5.riskBand as keyof Omit<LockBucket, "label" | "daysMin" | "daysMax">;
    if (result.f5.pastLock) {
      buckets[0][band]++;
      continue;
    }

    const days = result.f5.daysToLock ?? 0;
    const bucket = buckets.find(
      (row) => row.daysMin !== -Infinity && days >= row.daysMin && days <= row.daysMax
    );
    if (bucket) bucket[band]++;
  }

  const holisticRows: HolisticStudentRisk[] = allResults.map((result) =>
    attachOverallRisk(
      getHolisticProfile(result.studentId),
      result.f5.applicable ? result.f5.riskBand : "NOT_APPLICABLE"
    )
  );
  const holisticById = new Map(holisticRows.map((row) => [row.studentId, row]));

  const students: CohortStudentRow[] = allResults.map((result) => {
    const holistic = holisticById.get(result.studentId)!;
    return {
      studentId: result.studentId,
      highSchoolId: result.highSchoolId,
      firstName: result.firstName,
      lastName: result.lastName,
      sport: result.sport,
      grade: result.grade,
      highSchoolName: result.highSchoolName,
      targetDivision: result.targetDivision,
      riskBand: result.f5.applicable ? result.f5.riskBand : "NOT_APPLICABLE",
      daysToLock: result.f5.daysToLock,
      completedTotal: result.f5.completedTotal,
      missingTotal: result.f5.missingTotal,
      completedEngMathSci: result.f5.completedEngMathSci,
      missingEngMathSci: result.f5.missingEngMathSci,
      provisionalFlag: result.f5.provisionalFlag,
      evidenceTier: result.f5.evidenceTier,
      agDualFlagCount: result.f5.agFailureDualFlags.length,
      lockInDate: result.f5.lockInDate?.toISOString().split("T")[0] ?? null,
      lockInDateBasis: result.f5.lockInDateBasis,
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

  return {
    computedAt: computedAt.toISOString(),
    totalStudents: allResults.length,
    bandSummary,
    lockDistributionSeries: buckets,
    students,
    holisticSummary: computeFrameworkSummary(holisticRows),
    holisticRows,
    approachingDeadlines: computeApproachingDeadlines({
      today: computedAt,
      students,
      holisticRows,
      deadlines: MUSD_COHORT_DEADLINES,
    }),
  };
}

export async function buildCohortResponse(): Promise<CohortApiResponse> {
  let allResults: CohortResultRow[] = [];
  let computedAt = new Date();

  try {
    allResults = await getDbCohortResults();
  } catch {
    allResults = [];
  }

  if (allResults.length === 0) {
    allResults = computeAllDemoResults();
    computedAt = DEMO_TODAY;
  }

  const responseWithoutReadiness = buildResponseFromResults(allResults, computedAt);
  const ncaaReadiness = await computeNcaaReadinessSummary(
    responseWithoutReadiness.students.map((student) => ({
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
    ...responseWithoutReadiness,
    ncaaReadiness,
  };
}

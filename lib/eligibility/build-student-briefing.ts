/**
 * Sprint 5 — shared student briefing builder.
 *
 * Consumed by:
 *   • GET /api/students/[id]/eligibility (existing)
 *   • POST /api/pdf/student         (PDF generation, single student)
 *   • POST /api/pdf/cohort          (PDF generation, looped over cohort)
 *
 * Centralizing the F1–F12 wiring keeps API + PDF in lockstep so the briefing
 * the advisor sees on screen is byte-for-byte the briefing exported to PDF.
 */

import { ALL_DEMO_STUDENTS, DEMO_TODAY, MUSD_CALENDAR, STUDENT_NAMES } from "@/lib/seed/demo-data";
import {
  f5CoursesToClassified,
  f5StudentToStudentInput,
} from "@/lib/eligibility/demo-classified-courses";
import { computeEligibilityBundle } from "@/lib/eligibility/compute-eligibility";
import type { EligibilityBundle } from "@/lib/eligibility/compute-eligibility";
import { calcEligibilitySummary } from "@/lib/calculations/f8";
import {
  calcNcaa107Status,
  type F5CourseRecord,
  type F5SchoolCalendar,
  type F5StudentInput,
} from "@/lib/calculations/f5";
import { calcGpaTrajectory } from "@/lib/calculations/f9";
import { calcAimsRiskSignal } from "@/lib/calculations/f10";
import { calcEngagementMetrics } from "@/lib/calculations/f11";
import { calcMasterBriefing } from "@/lib/calculations/f12";
import type {
  F8Result,
  F9Result,
  F10Result,
  F11Result,
  F12Result,
} from "@/lib/calculations/types";
import { prismaTtg } from "@/lib/prisma";
import type { CourseRecord, HighSchool, StudentAthlete } from "@prisma/client";

export interface StudentBriefingHeader {
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  sport: string;
  targetDivision: string;
  graduationYear: number;
  highSchoolName: string;
}

export interface StudentBriefingRecord {
  header: StudentBriefingHeader;
  bundle: EligibilityBundle;
  f8: F8Result;
  f9: F9Result;
  f10: F10Result;
  f11: F11Result;
  f12: F12Result;
  computedAt: string;
  /** F5 lock-in date — useful for PDF rendering. */
  lockInDate: Date | null;
  /**
   * Sprint 7 / Workstream ML — latest trajectory risk score (advisory only).
   * Optional because computeMlScore() runs fire-and-forget and may not have
   * landed a row yet for a brand-new student.
   */
  ml: {
    score: number;
    confidence_lower: number;
    confidence_upper: number;
    risk_tier: "low" | "moderate" | "high";
    model_version: string;
    computed_at: string;
  } | null;
  /** Sprint 6 — observation slices used by the Trajectory tab charts. */
  observations: {
    grades: Array<{ observed_grade: string; observed_at: string }>;
    engagement: Array<{ observed_at: string; engagement_type: string; value: number }>;
    aims: Array<{
      administered_at: string;
      social_identity_score: number;
      exclusivity_score: number;
      negative_affectivity_score: number;
      aims_version: string;
    }>;
  };
}

export type StudentBriefingResult =
  | { found: true; record: StudentBriefingRecord }
  | { found: false };

/**
 * Sprint 7 / Workstream T-4 — calibrated thresholds.
 * Optional so existing callers don't break; the default values match the
 * THRESHOLD_PENDING_* placeholders that lived in code before Sprint 7.
 */
export interface BriefingThresholds {
  /** F10 within-subject AIMS delta cutoff. DB key: 'f10.pct_delta_threshold'. */
  aimsPctDelta?: number;
  /** F11 low-engagement cutoff. DB key: 'f11.low_engagement_cutoff'. */
  lowEngagementCutoff?: number;
  /** F12 weeks_to_critical_action assigned to YELLOW band. DB key: 'f12.yellow_action_weeks'. */
  yellowActionWeeks?: number;
  /** ML confidence margin around the score. DB key: 'ml.confidence_margin'. */
  mlConfidenceMargin?: number;
}

export const DEFAULT_BRIEFING_THRESHOLDS: Required<BriefingThresholds> = {
  aimsPctDelta: 0.2,
  lowEngagementCutoff: 0.4,
  yellowActionWeeks: 4,
  mlConfidenceMargin: 0.12,
};

function resolveThresholds(input?: BriefingThresholds): Required<BriefingThresholds> {
  return {
    aimsPctDelta: input?.aimsPctDelta ?? DEFAULT_BRIEFING_THRESHOLDS.aimsPctDelta,
    lowEngagementCutoff:
      input?.lowEngagementCutoff ?? DEFAULT_BRIEFING_THRESHOLDS.lowEngagementCutoff,
    yellowActionWeeks:
      input?.yellowActionWeeks ?? DEFAULT_BRIEFING_THRESHOLDS.yellowActionWeeks,
    mlConfidenceMargin:
      input?.mlConfidenceMargin ?? DEFAULT_BRIEFING_THRESHOLDS.mlConfidenceMargin,
  };
}

type BriefingSource = {
  student: F5StudentInput;
  courses: F5CourseRecord[];
  calendar: F5SchoolCalendar | null;
  calendarYear: string;
  names: { firstName: string; lastName: string; sport: string };
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

async function resolveBriefingSource(studentId: string): Promise<BriefingSource | null> {
  const demo = ALL_DEMO_STUDENTS.find((d) => d.student.id === studentId);
  if (demo) {
    const names = STUDENT_NAMES[studentId];
    return {
      student: demo.student,
      courses: demo.courses,
      calendar: demo.calendar,
      calendarYear: demo.calendarYear,
      names: {
        firstName: names?.firstName ?? "Student",
        lastName: names?.lastName ?? "",
        sport: names?.sport ?? "Unknown",
      },
    };
  }

  type DbStudent = StudentAthlete & {
    courses: CourseRecord[];
    highSchool: HighSchool | null;
  };

  const dbStudent = await prismaTtg.studentAthlete
    .findUnique({
      where: { id: studentId },
      include: { courses: true, highSchool: true },
    })
    .catch(() => null);

  if (!dbStudent) return null;

  const student = dbStudent as DbStudent;
  const seedName = STUDENT_NAMES[studentId];

  return {
    student: {
      id: student.id,
      targetDivision: student.targetDivision,
      enrollmentDateGrade9: student.enrollmentDateGrade9,
      highSchoolId: student.highSchoolId,
      highSchoolName: student.highSchoolName ?? student.highSchool?.schoolName ?? "Unknown High School",
      grade: student.grade,
    },
    courses: student.courses.map(mapCourseRecordToF5),
    calendar: mapHighSchoolToCalendar(student.highSchool) ?? MUSD_CALENDAR,
    calendarYear: "2026",
    names: {
      firstName: student.firstName,
      lastName: student.lastName,
      sport: seedName?.sport ?? "Unknown",
    },
  };
}

export async function buildStudentBriefing(
  studentId: string,
  thresholdInput?: BriefingThresholds
): Promise<StudentBriefingResult> {
  const thresholds = resolveThresholds(thresholdInput);
  const source = await resolveBriefingSource(studentId);
  if (!source) return { found: false };

  const { student, courses, calendar, calendarYear, names } = source;
  const fullName = `${names.firstName} ${names.lastName}`.trim();
  const studentInput = f5StudentToStudentInput(student);
  const classifiedCourses = f5CoursesToClassified(courses, `${calendarYear}-26`);
  const bundle = computeEligibilityBundle(studentInput, classifiedCourses);

  const f5 = calcNcaa107Status(student, courses, calendar, DEMO_TODAY);
  const f8 = await calcEligibilitySummary(
    studentId,
    {
      ...studentInput,
      f5RiskBand: f5.riskBand,
    } as typeof studentInput,
    bundle.f1,
    bundle.f2,
    bundle.f3,
    bundle.f4,
    bundle.f6,
    bundle.f7,
    prismaTtg
  );

  const gradeUpdates = await prismaTtg.gradeUpdate.findMany({
    where: { student_id: studentId },
    orderBy: { observed_at: "asc" },
    select: {
      observed_grade: true,
      observed_at: true,
      data_source_class: true,
    },
  });
  const aimsAssessments = await prismaTtg.aimsAssessment.findMany({
    where: { student_id: studentId },
    orderBy: { administered_at: "asc" },
    select: {
      social_identity_score: true,
      exclusivity_score: true,
      negative_affectivity_score: true,
      administered_at: true,
      aims_version: true,
    },
  });
  const engagementObs = await prismaTtg.engagementObservation.findMany({
    where: { student_id: studentId },
    orderBy: { observed_at: "asc" },
    select: {
      observed_at: true,
      engagement_type: true,
      value: true,
      data_source_class: true,
    },
  });

  const f9 = calcGpaTrajectory(
    gradeUpdates.map((row) => ({
      observed_grade: row.observed_grade,
      observed_at: row.observed_at,
      data_source_class: row.data_source_class as "A" | "B" | "C",
    }))
  );
  const f10 = calcAimsRiskSignal(
    aimsAssessments.map((row) => ({
      social_identity_score: row.social_identity_score,
      exclusivity_score: row.exclusivity_score,
      negative_affectivity_score: row.negative_affectivity_score,
      administered_at: row.administered_at,
      aims_version: row.aims_version,
    })),
    {
      method: "within_subject_pct_delta_v0.1_placeholder",
      // THRESHOLD_PENDING_D3 → DB key 'f10.pct_delta_threshold' — update via Settings > Thresholds.
      pct_delta_threshold: thresholds.aimsPctDelta,
    }
  );
  const f11 = calcEngagementMetrics(
    engagementObs.map((row) => ({
      observed_at: row.observed_at,
      engagement_type: row.engagement_type as
        | "practice_attendance"
        | "academic_session"
        | "advisor_contact"
        | "team_activity"
        | "self_report_motivation",
      value: row.value,
      data_source_class: row.data_source_class as "A" | "B" | "C",
    })),
    { lowEngagementCutoff: thresholds.lowEngagementCutoff }
  );

  const referenceDate = new Date();
  const f12 = calcMasterBriefing(
    {
      student_id: studentId,
      name: fullName,
      division_intent: [student.targetDivision],
      sport: names.sport,
      graduation_year: student.enrollmentDateGrade9.getFullYear() + 3,
      referenceDate,
      lock_in_date: f5.lockInDate,
    },
    bundle.f1,
    bundle.f2,
    bundle.f3,
    bundle.f4,
    bundle.f6,
    bundle.f7,
    f8,
    f9,
    f10,
    f11,
    { yellowActionWeeks: thresholds.yellowActionWeeks }
  );

  // Sprint 7 / Workstream ML — fire-and-forget the score so this builder
  // doesn't add latency. We still attach the latest stored score to the
  // record below for the UI.
  try {
    const { extractFeatureVector } = await import("@/lib/ml/extractFeatureVector");
    const { computeMlScore } = await import("@/lib/ml/computeMlScore");
    const featureVector = extractFeatureVector(
      {
        student_id: studentId,
        name: fullName,
        division_intent: [student.targetDivision],
        sport: names.sport,
        graduation_year: student.enrollmentDateGrade9.getFullYear() + 3,
        referenceDate,
        lock_in_date: f5.lockInDate,
      },
      bundle.f1,
      bundle.f3,
      bundle.f4,
      bundle.f6,
      bundle.f7,
      f8,
      f9,
      f10,
      f11
    );
    void computeMlScore(studentId, featureVector, {
      confidenceMargin: thresholds.mlConfidenceMargin,
    }).catch((err) => {
      console.error("[eligibility] ML score failed", err);
    });
  } catch (err) {
    console.error("[eligibility] ML feature extraction failed", err);
  }

  const latestMlRow = await prismaTtg.mlTrajectoryScore
    .findFirst({
      where: { student_id: studentId },
      orderBy: { computed_at: "desc" },
      select: {
        score: true,
        confidence_lower: true,
        confidence_upper: true,
        risk_tier: true,
        model_version: true,
        computed_at: true,
      },
    })
    .catch(() => null);

  const ml = latestMlRow
    ? {
        score: latestMlRow.score,
        confidence_lower: latestMlRow.confidence_lower,
        confidence_upper: latestMlRow.confidence_upper,
        risk_tier: latestMlRow.risk_tier as "low" | "moderate" | "high",
        model_version: latestMlRow.model_version,
        computed_at: latestMlRow.computed_at.toISOString(),
      }
    : null;

  return {
    found: true,
    record: {
      header: {
        studentId,
        firstName: names.firstName,
        lastName: names.lastName,
        fullName,
        sport: names.sport,
        targetDivision: student.targetDivision,
        graduationYear: student.enrollmentDateGrade9.getFullYear() + 3,
        highSchoolName: student.highSchoolName,
      },
      bundle,
      f8,
      f9,
      f10,
      f11,
      f12,
      computedAt: referenceDate.toISOString(),
      lockInDate: f5.lockInDate ?? null,
      ml,
      observations: {
        grades: gradeUpdates.map((row) => ({
          observed_grade: row.observed_grade,
          observed_at: row.observed_at.toISOString(),
        })),
        engagement: engagementObs.map((row) => ({
          observed_at: row.observed_at.toISOString(),
          engagement_type: row.engagement_type,
          value: row.value,
        })),
        aims: aimsAssessments.map((row) => ({
          administered_at: row.administered_at.toISOString(),
          social_identity_score: row.social_identity_score,
          exclusivity_score: row.exclusivity_score,
          negative_affectivity_score: row.negative_affectivity_score,
          aims_version: row.aims_version,
        })),
      },
    },
  };
}

export async function buildAllStudentBriefings(): Promise<StudentBriefingRecord[]> {
  const records: StudentBriefingRecord[] = [];
  for (const demo of ALL_DEMO_STUDENTS) {
    const result = await buildStudentBriefing(demo.student.id);
    if (result.found) records.push(result.record);
  }
  return records;
}

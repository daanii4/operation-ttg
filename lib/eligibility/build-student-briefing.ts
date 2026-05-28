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

import { ALL_DEMO_STUDENTS, DEMO_TODAY, STUDENT_NAMES } from "@/lib/seed/demo-data";
import {
  f5CoursesToClassified,
  f5StudentToStudentInput,
} from "@/lib/eligibility/demo-classified-courses";
import { computeEligibilityBundle } from "@/lib/eligibility/compute-eligibility";
import type { EligibilityBundle } from "@/lib/eligibility/compute-eligibility";
import { calcEligibilitySummary } from "@/lib/calculations/f8";
import { calcNcaa107Status } from "@/lib/calculations/f5";
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

export async function buildStudentBriefing(
  studentId: string
): Promise<StudentBriefingResult> {
  const demo = ALL_DEMO_STUDENTS.find((d) => d.student.id === studentId);
  if (!demo) return { found: false };

  const names = STUDENT_NAMES[studentId];
  const fullName = `${names?.firstName ?? "Student"} ${names?.lastName ?? ""}`.trim();
  const studentInput = f5StudentToStudentInput(demo.student);
  const courses = f5CoursesToClassified(demo.courses, `${demo.calendarYear}-26`);
  const bundle = computeEligibilityBundle(studentInput, courses);

  const f5 = calcNcaa107Status(demo.student, demo.courses, demo.calendar, DEMO_TODAY);
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
      // THRESHOLD_PENDING_D3: kept in sync with /api/students/[id]/eligibility.
      pct_delta_threshold: 0.2,
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
    }))
  );

  const referenceDate = new Date();
  const f12 = calcMasterBriefing(
    {
      student_id: studentId,
      name: fullName,
      division_intent: [demo.student.targetDivision],
      sport: names?.sport ?? "Unknown",
      graduation_year: demo.student.enrollmentDateGrade9.getFullYear() + 3,
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
    f11
  );

  return {
    found: true,
    record: {
      header: {
        studentId,
        firstName: names?.firstName ?? "Student",
        lastName: names?.lastName ?? "",
        fullName,
        sport: names?.sport ?? "Unknown",
        targetDivision: demo.student.targetDivision,
        graduationYear: demo.student.enrollmentDateGrade9.getFullYear() + 3,
        highSchoolName: demo.student.highSchoolName,
      },
      bundle,
      f8,
      f9,
      f10,
      f11,
      f12,
      computedAt: referenceDate.toISOString(),
      lockInDate: f5.lockInDate ?? null,
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

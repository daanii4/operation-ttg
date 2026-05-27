import { NextResponse } from "next/server";
import { ALL_DEMO_STUDENTS, DEMO_TODAY, STUDENT_NAMES } from "@/lib/seed/demo-data";
import {
  f5CoursesToClassified,
  f5StudentToStudentInput,
} from "@/lib/eligibility/demo-classified-courses";
import { computeEligibilityBundle } from "@/lib/eligibility/compute-eligibility";
import { calcEligibilitySummary } from "@/lib/calculations/f8";
import { calcNcaa107Status } from "@/lib/calculations/f5";
import { calcGpaTrajectory } from "@/lib/calculations/f9";
import { calcAimsRiskSignal } from "@/lib/calculations/f10";
import { calcEngagementMetrics } from "@/lib/calculations/f11";
import { calcMasterBriefing } from "@/lib/calculations/f12";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireTtgSession();
  } catch (err) {
    return handleAuthError(err);
  }

  const demo = ALL_DEMO_STUDENTS.find((d) => d.student.id === params.id);
  if (!demo) return notFoundResponse();

  try {
    const student = f5StudentToStudentInput(demo.student);
    const courses = f5CoursesToClassified(demo.courses, `${demo.calendarYear}-26`);
    const bundle = computeEligibilityBundle(student, courses);
    const f5 = calcNcaa107Status(demo.student, demo.courses, demo.calendar, DEMO_TODAY);
    const f8 = await calcEligibilitySummary(
      params.id,
      {
        ...student,
        f5RiskBand: f5.riskBand,
      } as typeof student,
      bundle.f1,
      bundle.f2,
      bundle.f3,
      bundle.f4,
      bundle.f6,
      bundle.f7,
      prismaTtg
    );
    const gradeUpdates = await prismaTtg.gradeUpdate.findMany({
      where: { student_id: params.id },
      orderBy: { observed_at: "asc" },
      select: {
        observed_grade: true,
        observed_at: true,
        data_source_class: true,
      },
    });
    const aimsAssessments = await prismaTtg.aimsAssessment.findMany({
      where: { student_id: params.id },
      orderBy: { administered_at: "asc" },
      select: {
        social_identity_score: true,
        exclusivity_score: true,
        negative_affectivity_score: true,
        administered_at: true,
        aims_version: true,
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
        pct_delta_threshold: 0.2, // THRESHOLD_PENDING_D3: placeholder 20% delta — replace with SD-based config from Brewer et al. when D3 delivers
      }
    );
    const engagementObs = await prismaTtg.engagementObservation.findMany({
      where: { student_id: params.id },
      orderBy: { observed_at: "asc" },
      select: {
        observed_at: true,
        engagement_type: true,
        value: true,
        data_source_class: true,
      },
    });
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
    const f12 = calcMasterBriefing(
      {
        student_id: params.id,
        name: `${STUDENT_NAMES[params.id]?.firstName ?? "Student"} ${STUDENT_NAMES[params.id]?.lastName ?? ""}`.trim(),
        division_intent: [demo.student.targetDivision],
        sport: STUDENT_NAMES[params.id]?.sport ?? "Unknown",
        graduation_year: demo.student.enrollmentDateGrade9.getFullYear() + 3,
        referenceDate: new Date(),
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

    return NextResponse.json({
      ...bundle,
      f8,
      f9,
      f10,
      f11,
      f12,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Eligibility computation failed", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

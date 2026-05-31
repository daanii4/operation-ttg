import type { AdvisorRole } from "@prisma/client";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getStudentScope } from "@/lib/auth/student-scope";
import type { TtgSession } from "@/lib/auth/session";
import {
  buildStudentBriefing,
  type BriefingThresholds,
} from "@/lib/eligibility/build-student-briefing";
import {
  THRESHOLD_KEYS,
  getThresholdMap,
} from "@/lib/config/thresholds";
import { loadEscalationMeta } from "@/lib/briefings/load-escalation-meta";
import { prismaTtg } from "@/lib/prisma";
import { ALL_DEMO_STUDENTS, STUDENT_NAMES } from "@/lib/seed/demo-data";
import type { ProfileEligibilityPayload, ProfileStudent } from "@/app/students/[id]/profile-types";

const ALL_THRESHOLD_KEYS = Object.values(THRESHOLD_KEYS);

async function loadThresholds(): Promise<BriefingThresholds> {
  try {
    const map = await getThresholdMap(ALL_THRESHOLD_KEYS);
    return {
      lowEngagementCutoff: map.get(THRESHOLD_KEYS.F11_LOW_ENGAGEMENT_CUTOFF),
      yellowActionWeeks: map.get(THRESHOLD_KEYS.F12_YELLOW_ACTION_WEEKS),
      aimsPctDelta: map.get(THRESHOLD_KEYS.F10_PCT_DELTA_THRESHOLD),
      mlConfidenceMargin: map.get(THRESHOLD_KEYS.ML_CONFIDENCE_MARGIN),
    };
  } catch {
    return {};
  }
}

function demoProfileStudent(studentId: string): ProfileStudent | null {
  const demo = ALL_DEMO_STUDENTS.find((d) => d.student.id === studentId);
  if (!demo) return null;
  const names = STUDENT_NAMES[studentId];
  return {
    id: studentId,
    firstName: names?.firstName ?? "Student",
    lastName: names?.lastName ?? "",
    grade: demo.student.grade,
    targetDivision: demo.student.targetDivision,
    highSchoolName: demo.student.highSchoolName,
    districtName: "Manteca USD",
    sport: names?.sport ?? "Unknown",
    advisorId: null,
    courses: demo.courses.map((c) => ({
      id: c.id,
      courseName: c.courseName,
      gradeLetterNormalized: c.gradeLetterNormalized,
      term: null,
      termEndDate: c.termEndDate.toISOString(),
      termLength: "semester",
      academicYear: null,
      dataSourceClass: "C",
      ncaaD1Category: c.ncaaD1Category,
    })),
  };
}

function serializeStudent(
  row: Awaited<ReturnType<typeof fetchStudentRow>>
): ProfileStudent | null {
  if (!row) return null;
  const sport = STUDENT_NAMES[row.id]?.sport ?? "Unknown";
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    grade: row.grade,
    targetDivision: row.targetDivision,
    highSchoolName: row.highSchoolName,
    districtName: row.highSchool?.district?.districtName ?? null,
    sport,
    advisorId: row.advisorId,
    courses: row.courses.map((c) => ({
      id: c.id,
      courseName: c.courseName,
      gradeLetterNormalized: c.gradeLetterNormalized,
      term: c.term,
      termEndDate: c.termEndDate.toISOString(),
      termLength: c.termLength,
      academicYear: c.academicYear,
      dataSourceClass: c.dataSourceClass,
      ncaaD1Category: c.ncaaD1Category,
    })),
  };
}

async function fetchStudentRow(
  advisorId: string,
  teamRole: AdvisorRole,
  studentId: string
) {
  const scope = await getStudentScope(advisorId, teamRole);
  const where =
    Object.keys(scope).length === 0
      ? { id: studentId }
      : { AND: [{ id: studentId }, scope] };
  return prismaTtg.studentAthlete.findFirst({
    where,
    include: {
      highSchool: { include: { district: true } },
      courses: { orderBy: { termEndDate: "desc" } },
    },
  });
}

export type LoadStudentProfileResult =
  | { kind: "redirect" }
  | { kind: "notFound" }
  | {
      kind: "ok";
      student: ProfileStudent;
      eligibility: ProfileEligibilityPayload | null;
      teamRole: AdvisorRole;
      sessionUserId: string;
    };

export async function loadStudentProfile(
  studentId: string,
  session: TtgSession
): Promise<LoadStudentProfileResult> {
  if (session.userId === "anonymous") {
    return { kind: "redirect" };
  }

  const profile = await ensureAdvisorProfile(session);
  const row = await fetchStudentRow(session.userId, profile.teamRole, studentId);
  const student = serializeStudent(row) ?? demoProfileStudent(studentId);
  if (!student) {
    return { kind: "notFound" };
  }

  let eligibility: ProfileEligibilityPayload | null = null;
  try {
    const thresholds = await loadThresholds();
    const briefing = await buildStudentBriefing(studentId, thresholds);
    if (briefing.found) {
      const { record } = briefing;
      const meta = await loadEscalationMeta(studentId);
      eligibility = {
        ...record.bundle,
        f8: record.f8,
        f9: record.f9,
        f10: record.f10,
        f11: record.f11,
        f12: record.f12,
        ml: record.ml,
        computedAt: record.computedAt,
        observations: record.observations,
        meta,
      };
    }
  } catch (err) {
    console.error("[loadStudentProfile] briefing failed:", err);
  }

  return {
    kind: "ok",
    student,
    eligibility,
    teamRole: profile.teamRole,
    sessionUserId: session.userId,
  };
}

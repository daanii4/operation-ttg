import type { StudentAthlete } from "@prisma/client";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import type { TtgSession } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/ttg-permissions";
import { prismaTtg } from "@/lib/prisma";
import type { StudentIntakeInput } from "@/lib/validators/student-intake";

export class StudentIntakeValidationError extends Error {
  readonly code = "VALIDATION_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "StudentIntakeValidationError";
  }
}

export async function createStudentAthlete(
  session: TtgSession,
  input: StudentIntakeInput
): Promise<StudentAthlete> {
  const profile = await ensureAdvisorProfile(session);
  assertPermission(profile.teamRole, "student:write");

  const school = await prismaTtg.highSchool.findUnique({
    where: { id: input.highSchoolId },
    select: { id: true, schoolName: true },
  });

  if (!school) {
    throw new StudentIntakeValidationError("Selected high school was not found.");
  }

  const enrollmentDateGrade9 = new Date(`${input.enrollmentDateGrade9}T12:00:00.000Z`);
  if (Number.isNaN(enrollmentDateGrade9.getTime())) {
    throw new StudentIntakeValidationError("Enrollment date is invalid.");
  }

  return prismaTtg.$transaction(async (tx) => {
    // advisorId references legacy NextAuth `User` rows — Supabase sessions use
    // AdvisorProfile + student_advisor_assignments instead (Sprint 6).
    const student = await tx.studentAthlete.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        grade: input.grade,
        targetDivision: input.targetDivision,
        enrollmentDateGrade9,
        highSchoolId: school.id,
        highSchoolName: school.schoolName,
      },
    });

    await tx.studentAdvisorAssignment.upsert({
      where: {
        student_id_advisor_id: {
          student_id: student.id,
          advisor_id: session.userId,
        },
      },
      create: {
        student_id: student.id,
        advisor_id: session.userId,
        assigned_by: session.userId,
      },
      update: {},
    });

    return student;
  });
}

import { calcNcaa107Status, type F5CourseRecord, type F5SchoolCalendar } from "@/lib/calculations/f5";
import { prismaTtg } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function mapCourseRecordToF5(course: {
  id: string;
  courseName: string;
  gradeLetterNormalized: string;
  termEndDate: Date;
  ncaaD1Category: string | null;
  ncaaApproved: boolean;
  agCategory: string | null;
  classificationUpdatedAt: Date | null;
}): F5CourseRecord {
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

function mapCalendarFromHighSchool(highSchool: {
  seniorFallTermStart: Date | null;
  summerTermEnd: Date | null;
  maxCoresPerTerm: number;
  maxEmsPerTerm: number;
  calendarSourceUrl: string | null;
} | null): F5SchoolCalendar | null {
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

export async function recalculateF5(studentId: string): Promise<void> {
  const student = await prismaTtg.studentAthlete.findUnique({
    where: { id: studentId },
    include: {
      courses: true,
      highSchool: {
        select: {
          seniorFallTermStart: true,
          summerTermEnd: true,
          maxCoresPerTerm: true,
          maxEmsPerTerm: true,
          calendarSourceUrl: true,
        },
      },
    },
  });

  if (!student) {
    return;
  }

  const result = calcNcaa107Status(
    {
      id: student.id,
      targetDivision: student.targetDivision,
      enrollmentDateGrade9: student.enrollmentDateGrade9,
      highSchoolId: student.highSchoolId,
      highSchoolName: student.highSchoolName,
      grade: student.grade,
    },
    student.courses.map(mapCourseRecordToF5),
    mapCalendarFromHighSchool(student.highSchool),
    new Date()
  );

  await prismaTtg.f5Result.create({
    data: {
      studentId: student.id,
      computedAt: result.computedAt,
      applicable: result.applicable,
      notApplicableReason: result.notApplicableReason ?? null,
      lockInDate: result.lockInDate,
      lockInDateBasis: result.lockInDateBasis,
      provisionalFlag: result.provisionalFlag,
      daysToLock: result.daysToLock,
      pastLock: result.pastLock,
      completedTotal: result.completedTotal,
      completedEngMathSci: result.completedEngMathSci,
      missingTotal: result.missingTotal,
      missingEngMathSci: result.missingEngMathSci,
      riskBand: result.riskBand,
      evidenceTier: result.evidenceTier,
      agFailureDualFlags: result.agFailureDualFlags as unknown as Prisma.InputJsonValue,
      unclassifiedCourseIds: result.unclassifiedCourses.map((course) => course.id),
      recommendedCoursesNextTerm:
        result.recommendedCoursesNextTerm as unknown as Prisma.InputJsonValue,
    },
  });
}

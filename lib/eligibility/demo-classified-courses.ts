/**
 * Demo bridge: F5CourseRecord[] → ClassifiedCourse[] for eligibility calculations.
 * Does not modify demo-data.ts — infers A-G fields when absent on seed rows.
 */
import type { F5CourseRecord, F5StudentInput } from "@/lib/calculations/f5";
import type { ClassifiedCourse, DataSourceClass, StudentInput } from "@/lib/calculations/types";
import { stripPlusMinus } from "@/lib/calculations/course-utils";
import { normalizeCourseName } from "@/lib/utils/course-normalize";

const NCAA_TO_AG: Record<string, string> = {
  eng: "b",
  math: "c",
  sci: "d",
  soc_sci: "a",
  addl_any: "g",
};

function inferAgCategory(course: F5CourseRecord): string | null {
  if (course.agCategory) return course.agCategory;
  const lower = course.courseName.toLowerCase();
  if (
    lower.includes("spanish") ||
    lower.includes("french") ||
    lower.includes("mandarin")
  ) {
    return "e";
  }
  if (course.ncaaD1Category && NCAA_TO_AG[course.ncaaD1Category]) {
    return NCAA_TO_AG[course.ncaaD1Category];
  }
  return null;
}

function academicYearFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth();
  if (m < 6) {
    return `${y - 1}-${String(y).slice(-2)}`;
  }
  return `${y}-${String(y + 1).slice(-2)}`;
}

export function f5StudentToStudentInput(student: F5StudentInput): StudentInput {
  return {
    id: student.id,
    enrollmentDateGrade9: student.enrollmentDateGrade9,
    highSchoolId: student.highSchoolId,
    highSchoolName: student.highSchoolName,
    grade: student.grade,
    targetDivision: student.targetDivision,
    state: "CA",
  };
}

export function f5CoursesToClassified(
  courses: F5CourseRecord[],
  defaultAcademicYear = "2025-26"
): ClassifiedCourse[] {
  return courses.map((c) => {
    const agCat = inferAgCategory(c);
    const lower = c.courseName.toLowerCase();
    const isGeometry = lower.includes("geometry");
    const isHonors = lower.includes("honors") || lower.startsWith("ap ");
    const agLanguageCode =
      agCat === "e"
        ? lower.includes("spanish")
          ? "es"
          : lower.includes("french")
            ? "fr"
            : null
        : null;

    return {
      id: c.id,
      courseName: c.courseName,
      courseNameNormalized: normalizeCourseName(c.courseName),
      gradeLetterNormalized: stripPlusMinus(c.gradeLetterNormalized),
      termEndDate: c.termEndDate,
      academicYear: academicYearFromDate(c.termEndDate) || defaultAcademicYear,
      termLength: "semester",
      agCategory: agCat,
      agApproved: agCat !== null,
      ucApprovedHonors: isHonors,
      countsLabForAg: agCat === "d" || c.ncaaD1Category === "sci",
      countsGeometryForAg: isGeometry,
      agLanguageCode,
      preNinthGradeEligible: agCat === "c" || agCat === "e",
      ncaaD1Category: c.ncaaD1Category,
      ncaaD2Category: c.ncaaD1Category,
      ncaaApproved: c.ncaaApproved,
      ncaaApprovedHonors: isHonors,
      countsGeometryForNcaa: isGeometry,
      classificationLastVerifiedDate: c.classificationUpdatedAt,
      dataSourceClass: "B" as DataSourceClass,
    };
  });
}

import type { ClassifiedCourse } from "../types";
import { normalizeCourseName } from "@/lib/utils/course-normalize";

export function makeClassifiedCourse(
  overrides: Partial<ClassifiedCourse> & { id: string; courseName: string }
): ClassifiedCourse {
  const name = overrides.courseName;
  return {
    id: overrides.id,
    courseName: name,
    courseNameNormalized:
      overrides.courseNameNormalized ?? normalizeCourseName(name),
    gradeLetterNormalized: overrides.gradeLetterNormalized ?? "B",
    termEndDate: overrides.termEndDate ?? new Date("2025-06-15"),
    academicYear: overrides.academicYear ?? "2024-25",
    termLength: overrides.termLength ?? "semester",
    agCategory: overrides.agCategory ?? null,
    agApproved: overrides.agApproved ?? false,
    ucApprovedHonors: overrides.ucApprovedHonors ?? false,
    countsLabForAg: overrides.countsLabForAg ?? false,
    countsGeometryForAg: overrides.countsGeometryForAg ?? false,
    agLanguageCode: overrides.agLanguageCode ?? null,
    preNinthGradeEligible: overrides.preNinthGradeEligible ?? false,
    ncaaD1Category: overrides.ncaaD1Category ?? null,
    ncaaD2Category: overrides.ncaaD2Category ?? null,
    ncaaApproved: overrides.ncaaApproved ?? false,
    ncaaApprovedHonors: overrides.ncaaApprovedHonors ?? false,
    countsGeometryForNcaa: overrides.countsGeometryForNcaa ?? false,
    classificationLastVerifiedDate:
      overrides.classificationLastVerifiedDate ?? new Date("2026-01-15"),
    dataSourceClass: overrides.dataSourceClass ?? "B",
  };
}

export const BASE_STUDENT = {
  id: "stu_test",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_test",
  highSchoolName: "Test High",
  grade: 11,
  targetDivision: "DI",
  state: "CA",
};

/**
 * Shared types for F1–F7 calculation functions.
 * F5 has its own types in f5.ts — do not import from here into f5.ts.
 */

export type EvidenceTier =
  | "Deterministic"
  | "Provisional"
  | "Insufficient"
  | "Not_Applicable";

export type DataSourceClass = "A" | "B" | "C" | "D";

export interface ClassifiedCourse {
  id: string;
  courseName: string;
  courseNameNormalized: string;
  gradeLetterNormalized: string;
  termEndDate: Date | null;
  academicYear: string;
  termLength: "year" | "semester" | "trimester" | "quarter";
  agCategory: string | null;
  agApproved: boolean;
  ucApprovedHonors: boolean;
  countsLabForAg: boolean;
  countsGeometryForAg: boolean;
  agLanguageCode: string | null;
  preNinthGradeEligible: boolean;
  ncaaD1Category: string | null;
  ncaaD2Category: string | null;
  ncaaApproved: boolean;
  ncaaApprovedHonors: boolean;
  countsGeometryForNcaa: boolean;
  classificationLastVerifiedDate: Date | null;
  dataSourceClass: DataSourceClass;
}

export interface StudentInput {
  id: string;
  enrollmentDateGrade9: Date;
  highSchoolId: string;
  highSchoolName: string;
  grade: number;
  targetDivision: string;
  state: string;
}

export interface RuleViolation {
  category: string;
  rule: string;
  message: string;
  blocking: boolean;
}

export interface CourseRecommendation {
  courseName: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

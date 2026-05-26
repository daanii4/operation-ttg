/**
 * F2 — calc_a_g_gpa
 */
import type { ClassifiedCourse, EvidenceTier, StudentInput } from "./types";
import {
  gradeToPoints,
  semestersValue,
  stripPlusMinus,
  dedupeKeepBestGrade,
  isInAgGpaWindow,
} from "./course-utils";

const HONORS_CAP_SEMESTERS = 8;
const CSU_THRESHOLD = 2.5;
const UC_THRESHOLD_EFFECTIVE = 3.0;

export interface F2Result {
  framework: "california_a_g_gpa";
  ucGpaWeighted: number;
  ucGpaUnweighted: number;
  totalCoursesInCalc: number;
  totalSemesters: number;
  basePointsSum: number;
  honorsBonusPoints: number;
  honorsSemestersUsed: number;
  honorsSemestersCap: 8;
  honorsCoursesCapped: string[];
  hoursCoursesExcludedByCap: string[];
  csuThreshold: 2.5;
  csuStatus: "ABOVE" | "BELOW";
  ucThresholdEffective: 3.0;
  ucStatus: "ABOVE" | "BELOW";
  evidenceTier: EvidenceTier;
  dataSourceClassesConsumed: string[];
  computedAt: Date;
}

type ScoredCourse = {
  course: ClassifiedCourse;
  semesters: number;
  basePoints: number;
  isHonors: boolean;
  gradePoints: number;
};

export function calcAgGpa(student: StudentInput, courses: ClassifiedCourse[]): F2Result {
  const computedAt = new Date();

  const inWindow = courses.filter(
    (c) =>
      c.agApproved &&
      c.agCategory !== null &&
      isInAgGpaWindow(c, student.enrollmentDateGrade9)
  );

  const normalized = inWindow.map((c) => ({
    ...c,
    gradeLetterNormalized: stripPlusMinus(c.gradeLetterNormalized),
  }));
  const unique = dedupeKeepBestGrade(normalized, true);

  const scored: ScoredCourse[] = [];
  for (const c of unique) {
    const pts = gradeToPoints(c.gradeLetterNormalized);
    if (pts === null) continue;
    const sems = semestersValue(c.termLength);
    scored.push({
      course: c,
      semesters: sems,
      basePoints: pts * sems,
      isHonors: c.ucApprovedHonors,
      gradePoints: pts,
    });
  }

  const totalSemesters = scored.reduce((sum, s) => sum + s.semesters, 0);
  const basePointsSum = scored.reduce((sum, s) => sum + s.basePoints, 0);

  const honorsCandidates = scored
    .filter((s) => s.isHonors && s.gradePoints >= 2)
    .sort(
      (a, b) =>
        b.gradePoints - a.gradePoints || b.semesters - a.semesters
    );

  let honorsSemestersUsed = 0;
  let honorsBonusPoints = 0;
  const honorsCoursesCapped: string[] = [];
  const hoursCoursesExcludedByCap: string[] = [];

  for (const s of honorsCandidates) {
    if (honorsSemestersUsed >= HONORS_CAP_SEMESTERS) {
      hoursCoursesExcludedByCap.push(s.course.courseName);
      continue;
    }
    const remaining = HONORS_CAP_SEMESTERS - honorsSemestersUsed;
    const eligible = Math.min(s.semesters, remaining);
    honorsBonusPoints += eligible * 1.0;
    honorsSemestersUsed += eligible;
    honorsCoursesCapped.push(s.course.courseName);
  }

  const ucGpaWeighted =
    totalSemesters > 0
      ? Math.round(((basePointsSum + honorsBonusPoints) / totalSemesters) * 1000) / 1000
      : 0;
  const ucGpaUnweighted =
    totalSemesters > 0
      ? Math.round((basePointsSum / totalSemesters) * 1000) / 1000
      : 0;

  return {
    framework: "california_a_g_gpa",
    ucGpaWeighted,
    ucGpaUnweighted,
    totalCoursesInCalc: unique.length,
    totalSemesters,
    basePointsSum,
    honorsBonusPoints,
    honorsSemestersUsed,
    honorsSemestersCap: 8,
    honorsCoursesCapped,
    hoursCoursesExcludedByCap,
    csuThreshold: CSU_THRESHOLD,
    csuStatus: ucGpaWeighted >= CSU_THRESHOLD ? "ABOVE" : "BELOW",
    ucThresholdEffective: UC_THRESHOLD_EFFECTIVE,
    ucStatus: ucGpaWeighted >= UC_THRESHOLD_EFFECTIVE ? "ABOVE" : "BELOW",
    evidenceTier: "Deterministic",
    dataSourceClassesConsumed: Array.from(new Set(courses.map((c) => c.dataSourceClass))),
    computedAt,
  };
}

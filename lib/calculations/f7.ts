/**
 * F7 — calc_ncaa_d2_gpa
 */
import type { ClassifiedCourse, EvidenceTier, StudentInput } from "./types";
import {
  gradeToPoints,
  semestersValue,
  stripPlusMinus,
  dedupeKeepBestGrade,
  isInNcaaWindow,
} from "./course-utils";

export type D2QualifierStatus = "FULL_QUALIFIER" | "PARTIAL_QUALIFIER";

export interface F7Result {
  applicable: boolean;
  framework: "ncaa_d2_gpa";
  coreGpaWeighted: number;
  coreGpaUnweighted: number;
  qualifierStatus: D2QualifierStatus;
  qualifierThresholdFull: 2.2;
  qualifierStatusProvisional: boolean;
  coresUsedInCalc: number;
  coresExcludedBeyond16: string[];
  evidenceTier: EvidenceTier;
  dataSourceClassesConsumed: string[];
  computedAt: Date;
}

export function calcNcaaD2Gpa(
  student: StudentInput,
  courses: ClassifiedCourse[]
): F7Result {
  const computedAt = new Date();

  if (!["DII", "DI_or_DII_undecided"].includes(student.targetDivision)) {
    return {
      applicable: false,
      framework: "ncaa_d2_gpa",
      coreGpaWeighted: 0,
      coreGpaUnweighted: 0,
      qualifierStatus: "PARTIAL_QUALIFIER",
      qualifierThresholdFull: 2.2,
      qualifierStatusProvisional: true,
      coresUsedInCalc: 0,
      coresExcludedBeyond16: [],
      evidenceTier: "Not_Applicable",
      dataSourceClassesConsumed: [],
      computedAt,
    };
  }

  const inWindow = courses.filter(
    (c) =>
      c.ncaaApproved &&
      c.ncaaD2Category !== null &&
      isInNcaaWindow(c, student.enrollmentDateGrade9) &&
      c.gradeLetterNormalized !== "IP"
  );

  const normalized = inWindow.map((c) => ({
    ...c,
    gradeLetterNormalized: stripPlusMinus(c.gradeLetterNormalized),
  }));
  const unique = dedupeKeepBestGrade(normalized);

  const scored = unique.map((c) => {
    const pts = gradeToPoints(c.gradeLetterNormalized) ?? 0;
    const sems = semestersValue(c.termLength);
    const honorsBonus = c.ncaaApprovedHonors && pts >= 1 ? 1.0 : 0;
    return {
      courseName: c.courseName,
      semesters: sems,
      basePoints: pts * sems,
      weightedPoints: (pts + honorsBonus) * sems,
    };
  });

  const sortedForBest16 = [...scored].sort(
    (a, b) => b.weightedPoints / b.semesters - a.weightedPoints / a.semesters
  );
  const best16 = sortedForBest16.slice(0, 16);
  const excluded = sortedForBest16.slice(16).map((s) => s.courseName);

  const totalSems = best16.reduce((s, c) => s + c.semesters, 0);
  const totalWeighted = best16.reduce((s, c) => s + c.weightedPoints, 0);
  const totalBase = best16.reduce((s, c) => s + c.basePoints, 0);

  const coreGpaWeighted =
    totalSems > 0 ? Math.round((totalWeighted / totalSems) * 1000) / 1000 : 0;
  const coreGpaUnweighted =
    totalSems > 0 ? Math.round((totalBase / totalSems) * 1000) / 1000 : 0;

  const qualifierStatus: D2QualifierStatus =
    coreGpaWeighted >= 2.2 ? "FULL_QUALIFIER" : "PARTIAL_QUALIFIER";

  return {
    applicable: true,
    framework: "ncaa_d2_gpa",
    coreGpaWeighted,
    coreGpaUnweighted,
    qualifierStatus,
    qualifierThresholdFull: 2.2,
    qualifierStatusProvisional: totalSems < 32,
    coresUsedInCalc: best16.length,
    coresExcludedBeyond16: excluded,
    evidenceTier: "Deterministic",
    dataSourceClassesConsumed: Array.from(new Set(courses.map((c) => c.dataSourceClass))),
    computedAt,
  };
}

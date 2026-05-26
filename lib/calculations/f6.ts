/**
 * F6 — calc_ncaa_d2_completion
 */
import type { ClassifiedCourse, EvidenceTier, RuleViolation, StudentInput } from "./types";
import {
  yearsValue,
  dedupeKeepBestGrade,
  isClassificationStale,
  isInNcaaWindow,
} from "./course-utils";

const D2_REQUIREMENTS = {
  eng: 3.0,
  math: 2.0,
  sci: 2.0,
  addl_ems: 3.0,
  soc_sci: 2.0,
  addl_any: 4.0,
} as const;

const TOTAL_REQUIRED = 16.0;
const PASSING_GRADES_NCAA = new Set(["A", "B", "C", "D"]);

export interface F6CategoryResult {
  completedYears: number;
  requiredYears: number;
  missingYears: number;
  complete: boolean;
  ruleViolations: RuleViolation[];
}

export interface F6Result {
  applicable: boolean;
  framework: "ncaa_d2_completion";
  perCategory: Record<string, F6CategoryResult>;
  totalRequired: 16;
  totalCompleted: number;
  fullyComplete: boolean;
  ruleViolations: RuleViolation[];
  failingCoreForRecovery: Array<{
    courseName: string;
    ncaaD2Category: string;
    gradeReceived: string;
    academicYear: string;
    recommendedAction: string;
  }>;
  unclassifiedCourses: ClassifiedCourse[];
  staleClassificationCount: number;
  evidenceTier: EvidenceTier;
  provisionalFlag: boolean;
  dataSourceClassesConsumed: string[];
  computedAt: Date;
}

export function calcNcaaD2Completion(
  student: StudentInput,
  courses: ClassifiedCourse[]
): F6Result {
  const computedAt = new Date();

  if (!["DII", "DI_or_DII_undecided"].includes(student.targetDivision)) {
    return notApplicable(computedAt, courses);
  }

  const staleCount = courses.filter(
    (c) => c.ncaaApproved && isClassificationStale(c.classificationLastVerifiedDate)
  ).length;
  const provisionalFlag = staleCount > 0;

  const d2Classified = courses.filter(
    (c) => c.ncaaApproved && c.ncaaD2Category !== null
  );
  const unclassified = courses.filter(
    (c) => !c.ncaaApproved && c.ncaaD2Category === null
  );

  const inWindow = d2Classified.filter((c) =>
    isInNcaaWindow(c, student.enrollmentDateGrade9)
  );

  const passing = inWindow.filter((c) =>
    PASSING_GRADES_NCAA.has(c.gradeLetterNormalized)
  );
  const failing = inWindow.filter((c) => c.gradeLetterNormalized === "F");

  const unique = dedupeKeepBestGrade(passing);

  const rawYears: Record<string, number> = {
    eng: 0,
    math: 0,
    sci: 0,
    addl_ems: 0,
    soc_sci: 0,
    addl_any: 0,
    lang: 0,
    religion_phil: 0,
  };
  for (const c of unique) {
    const cat = c.ncaaD2Category;
    if (cat && cat in rawYears) {
      rawYears[cat]! += yearsValue(c.termLength);
    }
  }

  const cappedYears: Record<string, number> = {
    eng: Math.min(rawYears.eng!, D2_REQUIREMENTS.eng),
    math: Math.min(rawYears.math!, D2_REQUIREMENTS.math),
    sci: Math.min(rawYears.sci!, D2_REQUIREMENTS.sci),
    soc_sci: Math.min(rawYears.soc_sci!, D2_REQUIREMENTS.soc_sci),
    addl_ems: 0,
    addl_any: 0,
  };

  const emsOverflow =
    Math.max(0, rawYears.eng! - D2_REQUIREMENTS.eng) +
    Math.max(0, rawYears.math! - D2_REQUIREMENTS.math) +
    Math.max(0, rawYears.sci! - D2_REQUIREMENTS.sci);

  cappedYears.addl_ems = Math.min(emsOverflow, D2_REQUIREMENTS.addl_ems);
  const emsRemaining = emsOverflow - cappedYears.addl_ems!;

  const otherOverflow =
    Math.max(0, rawYears.soc_sci! - D2_REQUIREMENTS.soc_sci) +
    (rawYears.lang ?? 0) +
    (rawYears.religion_phil ?? 0) +
    (rawYears.addl_any ?? 0);

  cappedYears.addl_any = Math.min(
    D2_REQUIREMENTS.addl_any,
    emsRemaining + otherOverflow
  );

  const perCategory: Record<string, F6CategoryResult> = {};
  let totalCompleted = 0;

  for (const [cat, required] of Object.entries(D2_REQUIREMENTS)) {
    const completed = cappedYears[cat] ?? 0;
    perCategory[cat] = {
      completedYears: completed,
      requiredYears: required,
      missingYears: Math.max(0, required - completed),
      complete: completed >= required,
      ruleViolations: [],
    };
    totalCompleted += completed;
  }

  const fullyComplete = totalCompleted >= TOTAL_REQUIRED;

  return {
    applicable: true,
    framework: "ncaa_d2_completion",
    perCategory,
    totalRequired: 16,
    totalCompleted,
    fullyComplete,
    ruleViolations: [],
    failingCoreForRecovery: failing.map((c) => ({
      courseName: c.courseName,
      ncaaD2Category: c.ncaaD2Category!,
      gradeReceived: c.gradeLetterNormalized,
      academicYear: c.academicYear,
      recommendedAction: "credit_recovery_or_grade_replacement",
    })),
    unclassifiedCourses: unclassified,
    staleClassificationCount: staleCount,
    evidenceTier: provisionalFlag ? "Provisional" : "Deterministic",
    provisionalFlag,
    dataSourceClassesConsumed: Array.from(new Set(courses.map((c) => c.dataSourceClass))),
    computedAt,
  };
}

function notApplicable(computedAt: Date, courses: ClassifiedCourse[]): F6Result {
  return {
    applicable: false,
    framework: "ncaa_d2_completion",
    perCategory: {},
    totalRequired: 16,
    totalCompleted: 0,
    fullyComplete: false,
    ruleViolations: [],
    failingCoreForRecovery: [],
    unclassifiedCourses: [],
    staleClassificationCount: 0,
    evidenceTier: "Not_Applicable",
    provisionalFlag: false,
    dataSourceClassesConsumed: Array.from(new Set(courses.map((c) => c.dataSourceClass))),
    computedAt,
  };
}

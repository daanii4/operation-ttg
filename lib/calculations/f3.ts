/**
 * F3 — calc_ncaa_d1_completion
 */
import type { ClassifiedCourse, EvidenceTier, RuleViolation, StudentInput } from "./types";
import {
  yearsValue,
  dedupeKeepBestGrade,
  isClassificationStale,
  isInNcaaWindow,
} from "./course-utils";

const D1_REQUIREMENTS = {
  eng: 4.0,
  math: 3.0,
  sci: 2.0,
  addl_ems: 1.0,
  soc_sci: 2.0,
  addl_any: 4.0,
} as const;

const TOTAL_REQUIRED = 16.0;
const PASSING_GRADES_NCAA = new Set(["A", "B", "C", "D"]);

export interface F3CategoryResult {
  completedYears: number;
  requiredYears: number;
  missingYears: number;
  complete: boolean;
  ruleViolations: RuleViolation[];
}

export interface F3Result {
  applicable: boolean;
  framework: "ncaa_d1_completion";
  perCategory: Record<string, F3CategoryResult>;
  totalRequired: 16;
  totalCompleted: number;
  geometrySatisfied: boolean;
  fullyComplete: boolean;
  ruleViolations: RuleViolation[];
  failingCoreForRecovery: Array<{
    courseName: string;
    ncaaD1Category: string;
    gradeReceived: string;
    academicYear: string;
    recommendedAction: string;
  }>;
  postGradExceptionAvailable: boolean;
  postGradExceptionReason: string | null;
  unclassifiedCourses: ClassifiedCourse[];
  staleClassificationCount: number;
  evidenceTier: EvidenceTier;
  provisionalFlag: boolean;
  dataSourceClassesConsumed: string[];
  computedAt: Date;
}

export function calcNcaaD1Completion(
  student: StudentInput,
  courses: ClassifiedCourse[],
  graduationDate?: Date | null
): F3Result {
  const computedAt = new Date();

  if (!["DI", "DI_or_DII_undecided"].includes(student.targetDivision)) {
    return notApplicable(computedAt, courses);
  }

  const staleCount = courses.filter(
    (c) => c.ncaaApproved && isClassificationStale(c.classificationLastVerifiedDate)
  ).length;
  const provisionalFlag = staleCount > 0;

  const eightSemWindowEnd = new Date(student.enrollmentDateGrade9);
  eightSemWindowEnd.setFullYear(eightSemWindowEnd.getFullYear() + 4);
  const postGradExceptionAvailable =
    graduationDate != null ? graduationDate <= eightSemWindowEnd : false;
  const postGradExceptionReason =
    graduationDate == null
      ? "graduation_date_missing — conservative: exception unavailable until date confirmed"
      : null;

  const d1Classified = courses.filter(
    (c) => c.ncaaApproved && c.ncaaD1Category !== null
  );
  const unclassified = courses.filter(
    (c) => !c.ncaaApproved && c.ncaaD1Category === null
  );

  const inWindow = d1Classified.filter((c) => {
    if (isInNcaaWindow(c, student.enrollmentDateGrade9)) return true;
    if (
      postGradExceptionAvailable &&
      c.termEndDate &&
      c.termEndDate > eightSemWindowEnd
    ) {
      return true;
    }
    return false;
  });

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
    if (c.ncaaD1Category && c.ncaaD1Category in rawYears) {
      rawYears[c.ncaaD1Category]! += yearsValue(c.termLength);
    }
  }

  const cappedYears: Record<string, number> = {
    eng: Math.min(rawYears.eng!, D1_REQUIREMENTS.eng),
    math: Math.min(rawYears.math!, D1_REQUIREMENTS.math),
    sci: Math.min(rawYears.sci!, D1_REQUIREMENTS.sci),
    soc_sci: Math.min(rawYears.soc_sci!, D1_REQUIREMENTS.soc_sci),
    addl_ems: 0,
    addl_any: 0,
  };

  const emsOverflow =
    Math.max(0, rawYears.eng! - D1_REQUIREMENTS.eng) +
    Math.max(0, rawYears.math! - D1_REQUIREMENTS.math) +
    Math.max(0, rawYears.sci! - D1_REQUIREMENTS.sci);

  cappedYears.addl_ems = Math.min(emsOverflow, D1_REQUIREMENTS.addl_ems);
  const emsRemainingAfterAddlEms = emsOverflow - cappedYears.addl_ems!;

  const otherOverflow =
    Math.max(0, rawYears.soc_sci! - D1_REQUIREMENTS.soc_sci) +
    (rawYears.lang ?? 0) +
    (rawYears.religion_phil ?? 0) +
    (rawYears.addl_any ?? 0);

  cappedYears.addl_any = Math.min(
    D1_REQUIREMENTS.addl_any,
    emsRemainingAfterAddlEms + otherOverflow
  );

  const geometrySatisfied = unique.some(
    (c) => c.ncaaD1Category === "math" && c.countsGeometryForNcaa
  );
  const ruleViolations: RuleViolation[] = [];
  if (!geometrySatisfied && (cappedYears.math ?? 0) >= D1_REQUIREMENTS.math) {
    ruleViolations.push({
      category: "math",
      rule: "geometry_required_for_d1",
      message:
        "Math year count met but geometry not documented. Source: NCAA IE Brochure 2025-26.",
      blocking: true,
    });
  }

  const perCategory: Record<string, F3CategoryResult> = {};
  let totalCompleted = 0;

  for (const [cat, required] of Object.entries(D1_REQUIREMENTS)) {
    const completed = cappedYears[cat] ?? 0;
    const catViolations = ruleViolations.filter((v) => v.category === cat);
    const hasBlocker = catViolations.some((v) => v.blocking);
    perCategory[cat] = {
      completedYears: completed,
      requiredYears: required,
      missingYears: Math.max(0, required - completed),
      complete: completed >= required && !hasBlocker,
      ruleViolations: catViolations,
    };
    totalCompleted += completed;
  }

  const fullyComplete =
    totalCompleted >= TOTAL_REQUIRED && geometrySatisfied && ruleViolations.every((v) => !v.blocking);

  return {
    applicable: true,
    framework: "ncaa_d1_completion",
    perCategory,
    totalRequired: 16,
    totalCompleted,
    geometrySatisfied,
    fullyComplete,
    ruleViolations,
    failingCoreForRecovery: failing.map((c) => ({
      courseName: c.courseName,
      ncaaD1Category: c.ncaaD1Category!,
      gradeReceived: c.gradeLetterNormalized,
      academicYear: c.academicYear,
      recommendedAction: "credit_recovery_or_grade_replacement",
    })),
    postGradExceptionAvailable,
    postGradExceptionReason,
    unclassifiedCourses: unclassified,
    staleClassificationCount: staleCount,
    evidenceTier: provisionalFlag ? "Provisional" : "Deterministic",
    provisionalFlag,
    dataSourceClassesConsumed: Array.from(new Set(courses.map((c) => c.dataSourceClass))),
    computedAt,
  };
}

function notApplicable(computedAt: Date, courses: ClassifiedCourse[]): F3Result {
  return {
    applicable: false,
    framework: "ncaa_d1_completion",
    perCategory: {},
    totalRequired: 16,
    totalCompleted: 0,
    geometrySatisfied: false,
    fullyComplete: false,
    ruleViolations: [],
    failingCoreForRecovery: [],
    postGradExceptionAvailable: false,
    postGradExceptionReason: null,
    unclassifiedCourses: [],
    staleClassificationCount: 0,
    evidenceTier: "Not_Applicable",
    provisionalFlag: false,
    dataSourceClassesConsumed: Array.from(new Set(courses.map((c) => c.dataSourceClass))),
    computedAt,
  };
}

/**
 * F1 — calc_a_g_completion
 */
import type { ClassifiedCourse, EvidenceTier, RuleViolation, StudentInput } from "./types";
import { yearsValue, dedupeKeepBestGrade, isClassificationStale } from "./course-utils";

const AG_REQUIREMENTS: Record<string, number> = {
  a: 2.0,
  b: 4.0,
  c: 3.0,
  d: 2.0,
  e: 2.0,
  f: 1.0,
  g: 1.0,
};

export interface F1CategoryResult {
  completedYears: number;
  requiredYears: number;
  missingYears: number;
  complete: boolean;
  ruleViolations: RuleViolation[];
}

export interface F1Result {
  framework: "california_a_g";
  perCategory: Record<string, F1CategoryResult>;
  totalRequiredYears: 15;
  totalCompletedYears: number;
  completionPct: number;
  fullyComplete: boolean;
  ruleViolations: RuleViolation[];
  creditRecoveryCandidates: Array<{
    courseName: string;
    agCategory: string;
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

export function calcAgCompletion(
  student: StudentInput,
  courses: ClassifiedCourse[]
): F1Result {
  const computedAt = new Date();

  const staleCourses = courses.filter(
    (c) => c.agApproved && isClassificationStale(c.classificationLastVerifiedDate)
  );
  const provisionalFlag = staleCourses.length > 0;

  const agClassified = courses.filter((c) => c.agApproved && c.agCategory !== null);
  const unclassifiedCourses = courses.filter(
    (c) => !c.agApproved && c.agCategory === null
  );

  const isPre9th = (c: ClassifiedCourse): boolean => {
    if (!c.termEndDate) return false;
    const grade9End = new Date(student.enrollmentDateGrade9);
    grade9End.setFullYear(grade9End.getFullYear() + 1);
    return c.termEndDate < grade9End;
  };

  const agEligible = agClassified.filter((c) => {
    if (isPre9th(c)) {
      return c.preNinthGradeEligible && (c.agCategory === "c" || c.agCategory === "e");
    }
    return true;
  });

  const agPassing = agEligible.filter((c) =>
    ["A", "B", "C"].includes(c.gradeLetterNormalized)
  );
  const agFailing = agEligible.filter((c) =>
    ["D", "F"].includes(c.gradeLetterNormalized)
  );

  const agUnique = dedupeKeepBestGrade(agPassing);

  const completedYears: Record<string, number> = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0,
    g: 0,
  };
  for (const c of agUnique) {
    if (!c.agCategory || !(c.agCategory in completedYears)) continue;
    completedYears[c.agCategory] += yearsValue(c.termLength);
  }

  const ruleViolations: RuleViolation[] = [];

  const hasGeometry = agUnique.some(
    (c) => c.agCategory === "c" && c.countsGeometryForAg
  );
  if (!hasGeometry && (completedYears.c ?? 0) >= AG_REQUIREMENTS.c) {
    ruleViolations.push({
      category: "c",
      rule: "geometry_required",
      message:
        "Math year count met but no geometry course documented. Source: UC A-G requirement for Mathematics.",
      blocking: true,
    });
  }

  const hasLab = agUnique.some((c) => c.agCategory === "d" && c.countsLabForAg);
  if (!hasLab && (completedYears.d ?? 0) >= AG_REQUIREMENTS.d) {
    ruleViolations.push({
      category: "d",
      rule: "lab_required",
      message:
        "Science year count met but no lab course documented. Source: UC A-G requirement for Laboratory Science.",
      blocking: true,
    });
  }

  const languageCourses = agUnique.filter((c) => c.agCategory === "e");
  const byLanguage = new Map<string, number>();
  for (const c of languageCourses) {
    const code = c.agLanguageCode ?? "_unknown";
    byLanguage.set(code, (byLanguage.get(code) ?? 0) + yearsValue(c.termLength));
  }
  const maxSameLanguage = Math.max(0, ...Array.from(byLanguage.values()));
  if (maxSameLanguage < AG_REQUIREMENTS.e && (completedYears.e ?? 0) >= AG_REQUIREMENTS.e) {
    ruleViolations.push({
      category: "e",
      rule: "same_language_2yrs_required",
      message:
        "Language year count met but spread across multiple languages. 2 years of the same language required.",
      blocking: true,
    });
  }

  const perCategory: Record<string, F1CategoryResult> = {};
  let totalCompletedYears = 0;

  for (const cat of Object.keys(AG_REQUIREMENTS)) {
    const required = AG_REQUIREMENTS[cat]!;
    const raw = completedYears[cat] ?? 0;
    const completed = Math.min(raw, required);
    const catViolations = ruleViolations.filter((v) => v.category === cat);
    const hasBlocker = catViolations.some((v) => v.blocking);

    perCategory[cat] = {
      completedYears: raw,
      requiredYears: required,
      missingYears: Math.max(0, required - raw),
      complete: completed >= required && !hasBlocker,
      ruleViolations: catViolations,
    };
    totalCompletedYears += completed;
  }

  const fullyComplete = Object.values(perCategory).every((r) => r.complete);

  const creditRecoveryCandidates = agFailing
    .filter((c) => c.agCategory)
    .map((c) => ({
      courseName: c.courseName,
      agCategory: c.agCategory!,
      gradeReceived: c.gradeLetterNormalized,
      academicYear: c.academicYear,
      recommendedAction: "credit_recovery_to_C_or_higher",
    }));

  return {
    framework: "california_a_g",
    perCategory,
    totalRequiredYears: 15,
    totalCompletedYears,
    completionPct: totalCompletedYears / 15,
    fullyComplete,
    ruleViolations,
    creditRecoveryCandidates,
    unclassifiedCourses,
    staleClassificationCount: staleCourses.length,
    evidenceTier: provisionalFlag ? "Provisional" : "Deterministic",
    provisionalFlag,
    dataSourceClassesConsumed: Array.from(new Set(courses.map((c) => c.dataSourceClass))),
    computedAt,
  };
}

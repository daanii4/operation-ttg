/**
 * F5 — calc_ncaa_10_7_status
 *
 * Implements the NCAA Division I 10/7 Core Course Progression Rule.
 * Source authority:
 *   - NCAA Bylaw 14.3 / Eligibility Center DI Core-Course Progression Requirement
 *   - NCAA IE Brochure 2025-26
 *   - Authority Decisions AD-1, AD-2, AD-3 (D1 Calculation Specification v0.1)
 *
 * This function is DETERMINISTIC and RULE-BASED. It makes no causal claims.
 * Every output field traces to a published NCAA authority or an explicit AD decision.
 *
 * DO NOT modify thresholds (required_total=10, required_eng_math_sci=7)
 * without a corresponding AD update from Daniel Henderson.
 */

import { differenceInDays, addYears, isBefore } from "date-fns";

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface F5CourseRecord {
  id: string;
  courseName: string;
  gradeLetterNormalized: string; // 'A'|'B'|'C'|'D'|'F'|'IP'
  termEndDate: Date;
  ncaaD1Category: string | null; // 'eng'|'math'|'sci'|'addl_ems'|'soc_sci'|'addl_any'|null
  ncaaApproved: boolean;
  agCategory: string | null; // 'a'|'b'|'c'|'d'|'e'|'f'|'g'|null
  classificationUpdatedAt: Date | null;
}

export interface F5SchoolCalendar {
  seniorFallTermStart: Date;
  summerTermEndDate?: Date;
  maxCoresPerTerm: number;
  maxEmsPerTerm: number;
  calendarSourceUrl: string | null;
}

export interface F5StudentInput {
  id: string;
  targetDivision: string;
  enrollmentDateGrade9: Date;
  highSchoolId: string;
  highSchoolName: string;
  grade: number;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface AgFailureDualFlag {
  courseId: string;
  courseName: string;
  ncaaStatus: "counted_for_10_7";
  agStatus: "fails_a_g_C_or_better_requirement";
  recommendedAction: "credit_recovery_to_C_or_higher";
}

export interface RecommendedCourse {
  courseName: string;
  priority: "HIGH" | "MEDIUM";
  reason: string;
  closesSubset: boolean;
}

export type RiskBand = "GREEN" | "YELLOW" | "RED" | "LOCKED";
export type EvidenceTier = "Deterministic" | "Provisional" | "Not_Applicable";

export type FallbackPathwayPrimary = "NCAA_DII" | "JUCO" | "NAIA" | "POST_GRAD_EXCEPTION";

export interface FallbackPathway {
  primary: FallbackPathwayPrimary;
  rationale: string;
  nextActions: Array<{ code: string; deadline?: string }>;
}

export interface F5Result {
  applicable: boolean;
  notApplicableReason?: string;

  framework: "ncaa_d1_10_7";
  lockInDate: Date | null;
  lockInDateBasis: "school_calendar" | "fallback_estimate_grade9_plus_3yr" | null;
  provisionalFlag: boolean;
  daysToLock: number | null;
  pastLock: boolean;

  requiredTotal: 10;
  requiredEngMathSci: 7;
  completedTotal: number;
  completedEngMathSci: number;
  missingTotal: number;
  missingEngMathSci: number;

  riskBand: RiskBand;
  evidenceTier: EvidenceTier;

  agFailureDualFlags: AgFailureDualFlag[];
  unclassifiedCourses: F5CourseRecord[];
  recommendedCoursesNextTerm: RecommendedCourse[];
  fallbackPathway: FallbackPathway | null;

  /** Derivation trace for each calculated field — powers the transparency layer */
  derivation: F5Derivation;

  computedAt: Date;
}

export interface F5Derivation {
  lockInDateExplanation: string;
  daysToLockExplanation: string;
  riskBandExplanation: string;
  completedCountExplanation: string;
  sourceAuthority: string;
  sourceUrl: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REQUIRED_TOTAL = 10 as const;
const REQUIRED_EMS = 7 as const;
const EMS_CATEGORIES = new Set(["eng", "math", "sci"]);
const PASSING_GRADES = new Set(["A", "B", "C", "D"]); // AD-2 + AD-3: D counts for NCAA
const STALE_CLASSIFICATION_DAYS = 365;

const DI_APPLICABLE_DIVISIONS = new Set([
  "DI",
  "DI_or_DII_undecided",
]);

type RemainingTerm = {
  label: string;
  endDate: Date;
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getRemainingTerms(
  today: Date,
  lockInDate: Date,
  schoolCalendar: F5SchoolCalendar | null,
  fallbackDaysToLock: number
): RemainingTerm[] {
  if (!schoolCalendar || !schoolCalendar.summerTermEndDate) {
    const estimatedTerms = Math.floor(fallbackDaysToLock / 90);
    return Array.from({ length: estimatedTerms }, (_, index) => ({
      label: `estimated term ${index + 1}`,
      endDate: lockInDate,
    }));
  }

  const terms: RemainingTerm[] = [];
  const summerTermEnd = schoolCalendar.summerTermEndDate;

  if (
    summerTermEnd &&
    isBefore(today, summerTermEnd) &&
    summerTermEnd.getTime() <= lockInDate.getTime()
  ) {
    terms.push({
      label: `summer ${summerTermEnd.getFullYear()}`,
      endDate: summerTermEnd,
    });
  }

  return terms;
}

function describeRemainingTerms(terms: RemainingTerm[]): string {
  if (terms.length === 0) return "0 terms";
  if (terms.length === 1) return `1 term (${terms[0].label})`;
  return `${terms.length} terms (${terms.map((term) => term.label).join(", ")})`;
}

// ─── Main Function ────────────────────────────────────────────────────────────

export function calcNcaa107Status(
  student: F5StudentInput,
  courses: F5CourseRecord[],
  schoolCalendar: F5SchoolCalendar | null,
  today: Date = new Date()
): F5Result {
  const computedAt = today;

  // ── STEP 1: Applicability check ──────────────────────────────────────────
  if (!DI_APPLICABLE_DIVISIONS.has(student.targetDivision)) {
    return {
      applicable: false,
      notApplicableReason: `Target division '${student.targetDivision}' is not DI or DI_or_DII_undecided`,
      framework: "ncaa_d1_10_7",
      lockInDate: null,
      lockInDateBasis: null,
      provisionalFlag: false,
      daysToLock: null,
      pastLock: false,
      requiredTotal: REQUIRED_TOTAL,
      requiredEngMathSci: REQUIRED_EMS,
      completedTotal: 0,
      completedEngMathSci: 0,
      missingTotal: REQUIRED_TOTAL,
      missingEngMathSci: REQUIRED_EMS,
      riskBand: "NOT_APPLICABLE" as unknown as RiskBand,
      evidenceTier: "Not_Applicable",
      agFailureDualFlags: [],
      unclassifiedCourses: [],
      recommendedCoursesNextTerm: [],
      fallbackPathway: null,
      derivation: {
        lockInDateExplanation: "Not applicable",
        daysToLockExplanation: "Not applicable",
        riskBandExplanation: "Student is not targeting DI — F5 does not apply",
        completedCountExplanation: "Not applicable",
        sourceAuthority: "D1 Calculation Specification v0.1 §7",
        sourceUrl: "https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/",
      },
      computedAt,
    };
  }

  // ── STEP 2: Resolve lock-in date (AD-1) ───────────────────────────────────
  let seventhSemesterStart: Date;
  let lockInDateBasis: "school_calendar" | "fallback_estimate_grade9_plus_3yr";
  let provisionalFlag = false;
  let lockInDateExplanation: string;

  if (schoolCalendar) {
    seventhSemesterStart = schoolCalendar.seniorFallTermStart;
    lockInDateBasis = "school_calendar";
    lockInDateExplanation =
      `Lock-in date anchored to ${student.highSchoolName}'s official academic calendar. ` +
      `First day of fall semester for grade 12 = ${formatDate(seventhSemesterStart)}. ` +
      `Authority: AD-1 (D1 Spec), ${schoolCalendar.calendarSourceUrl ?? "school calendar on file"}.`;
  } else {
    seventhSemesterStart = addYears(student.enrollmentDateGrade9, 3);
    lockInDateBasis = "fallback_estimate_grade9_plus_3yr";
    provisionalFlag = true;
    lockInDateExplanation =
      `No school calendar on file for ${student.highSchoolName}. ` +
      `Fallback: grade 9 enrollment (${formatDate(student.enrollmentDateGrade9)}) + 3 years = ` +
      `${formatDate(seventhSemesterStart)}. Result is PROVISIONAL per AD-1.`;
  }

  // ── STEP 3: Classification staleness check ──────────────────────────────
  const hasStaleClassifications = courses.some(
    (c) =>
      c.classificationUpdatedAt !== null &&
      differenceInDays(today, c.classificationUpdatedAt) > STALE_CLASSIFICATION_DAYS
  );
  if (hasStaleClassifications) {
    provisionalFlag = true;
  }

  // ── STEP 4: Identify unclassified courses ────────────────────────────────
  const unclassifiedCourses = courses.filter(
    (c) => c.ncaaD1Category === null && c.ncaaApproved === false
  );

  // ── STEP 5: Filter to completed courses before lock-in (AD-2) ────────────
  // AD-2: IP grades excluded. Strict less-than: term_end ON lock date is NOT counted.
  const completedBeforeLock = courses.filter((c) => {
    const passingGrade = PASSING_GRADES.has(c.gradeLetterNormalized.toUpperCase());
    const notInProgress = c.gradeLetterNormalized.toUpperCase() !== "IP";
    const termEndBeforeLock = isBefore(c.termEndDate, seventhSemesterStart);
    const ncaaClassified = c.ncaaD1Category !== null && c.ncaaApproved;
    return passingGrade && notInProgress && termEndBeforeLock && ncaaClassified;
  });

  // ── STEP 6: Deduplicate by best grade per course ─────────────────────────
  const gradeOrder: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
  const uniqueByBestGrade = new Map<string, F5CourseRecord>();

  for (const course of completedBeforeLock) {
    const existing = uniqueByBestGrade.get(course.courseName);
    if (!existing) {
      uniqueByBestGrade.set(course.courseName, course);
    } else {
      const existingPoints = gradeOrder[existing.gradeLetterNormalized.toUpperCase()] ?? 0;
      const currentPoints = gradeOrder[course.gradeLetterNormalized.toUpperCase()] ?? 0;
      if (currentPoints > existingPoints) {
        uniqueByBestGrade.set(course.courseName, course);
      }
    }
  }

  const d1UniqueCompleted = Array.from(uniqueByBestGrade.values());

  // ── STEP 7: Count totals and EMS subset ──────────────────────────────────
  const completedTotal = d1UniqueCompleted.length;
  const completedEngMathSci = d1UniqueCompleted.filter(
    (c) => c.ncaaD1Category !== null && EMS_CATEGORIES.has(c.ncaaD1Category)
  ).length;

  const missingTotal = Math.max(0, REQUIRED_TOTAL - completedTotal);
  const missingEngMathSci = Math.max(0, REQUIRED_EMS - completedEngMathSci);

  const completedCountExplanation =
    `${completedTotal} unique NCAA D1 core courses completed before lock-in date ` +
    `(${formatDate(seventhSemesterStart)}). ` +
    `Of these, ${completedEngMathSci} are in the English/Math/Science subset. ` +
    `Required: ${REQUIRED_TOTAL} total, ${REQUIRED_EMS} English/Math/Science. ` +
    `Missing: ${missingTotal} total, ${missingEngMathSci} English/Math/Science. ` +
    `Source: NCAA Bylaw 14.3 / NCAA IE Brochure 2025-26.`;

  // ── STEP 8: AD-3 dual-flag identification ─────────────────────────────────
  // D grades count toward NCAA 10-count (NCAA rule) but FAIL A-G C-or-better.
  const agFailureDualFlags: AgFailureDualFlag[] = d1UniqueCompleted
    .filter(
      (c) =>
        c.gradeLetterNormalized.toUpperCase() === "D" &&
        c.agCategory !== null
    )
    .map((c) => ({
      courseId: c.id,
      courseName: c.courseName,
      ncaaStatus: "counted_for_10_7" as const,
      agStatus: "fails_a_g_C_or_better_requirement" as const,
      recommendedAction: "credit_recovery_to_C_or_higher" as const,
    }));

  // ── STEP 9: Compute risk band (count-driven per OQ-F5-3) ─────────────────
  const pastLock = !isBefore(today, seventhSemesterStart);
  // differenceInDays returns positive when first arg > second arg
  const rawDaysToLock = differenceInDays(seventhSemesterStart, today);
  const daysToLock = pastLock ? 0 : rawDaysToLock;
  const daysPastLock = pastLock ? differenceInDays(today, seventhSemesterStart) : 0;

  const daysToLockExplanation =
    pastLock
      ? `Lock-in date (${formatDate(seventhSemesterStart)}) passed ${daysPastLock} day(s) ago. ` +
        `Student is past the 7th semester start. Source: NCAA Bylaw 14.3.`
      : `Lock-in date = ${formatDate(seventhSemesterStart)} (${lockInDateBasis === "school_calendar" ? student.highSchoolName + " academic calendar" : "fallback estimate: grade 9 enrollment + 3 years"}). ` +
        `Today = ${formatDate(today)}. ` +
        `Days to lock = ${daysToLock}. Source: NCAA Bylaw 14.3.`;

  // Determine terms remaining (OQ-F5-2: summer counts if it ends before lock)
  const maxCoresPerTerm = schoolCalendar?.maxCoresPerTerm ?? 4;
  const remainingTerms = pastLock
    ? []
    : getRemainingTerms(today, seventhSemesterStart, schoolCalendar, daysToLock);
  const termsRemaining = remainingTerms.length;
  const remainingTermsPhrase = describeRemainingTerms(remainingTerms);
  const remainingTermsVerb = termsRemaining === 1 ? "remains" : "remain";

  let riskBand: RiskBand;
  let riskBandExplanation: string;

  if (pastLock && missingTotal > 0) {
    riskBand = "LOCKED";
    riskBandExplanation =
      `LOCKED: Student is past the 7th semester start and still missing ${missingTotal} core course(s). ` +
      `These courses can no longer be added to the NCAA D1 10/7 count. ` +
      `Source: NCAA Bylaw 14.3 / AD-1.`;
  } else if (missingTotal === 0 && missingEngMathSci === 0) {
    riskBand = "GREEN";
    riskBandExplanation =
      `GREEN: All ${REQUIRED_TOTAL} required cores complete and all ${REQUIRED_EMS} EMS subset cores met. ` +
      `Student is on pace for NCAA D1 10/7 compliance.`;
  } else if (missingTotal > termsRemaining * maxCoresPerTerm) {
    riskBand = "RED";
    riskBandExplanation =
      `RED: ${missingTotal} cores missing but only ${remainingTermsPhrase} ${remainingTermsVerb} before lock. ` +
      `Maximum addable = ${termsRemaining} × ${maxCoresPerTerm} = ${termsRemaining * maxCoresPerTerm} cores. ` +
      `Recovery is not mathematically possible without extraordinary scheduling. ` +
      `Source: NCAA Bylaw 14.3 / D1 Spec OQ-F5-2.`;
  } else {
    riskBand = "YELLOW";
    riskBandExplanation =
      `YELLOW: ${missingTotal} core(s) and ${missingEngMathSci} English/Math/Science core(s) missing, ` +
      `but ${remainingTermsPhrase} ${remainingTermsVerb} before lock. ` +
      `Recovery is mathematically possible. Advisor action required. ` +
      `Source: NCAA Bylaw 14.3 / D1 Spec OQ-F5-2.`;
  }

  // ── STEP 10: Recommended next-term courses ────────────────────────────────
  // Deterministic — system reads gaps and prioritizes EMS closure first.
  // AI does NOT invent recommendations (D1 Spec §7).
  const recommendedCoursesNextTerm: RecommendedCourse[] = [];

  if (riskBand !== "LOCKED" && (missingEngMathSci > 0 || missingTotal > 0)) {
    if (
      missingEngMathSci > 0 &&
      d1UniqueCompleted.filter((c) => c.ncaaD1Category === "math").length < 3
    ) {
      recommendedCoursesNextTerm.push({
        courseName: "Mathematics (NCAA D1 approved)",
        priority: "HIGH",
        reason:
          "Closes math gap toward EMS subset requirement (7 of 10 must be English/Math/Science). " +
          "Source: NCAA Bylaw 14.3.",
        closesSubset: true,
      });
    }
    if (
      missingEngMathSci > 0 &&
      d1UniqueCompleted.filter((c) => c.ncaaD1Category === "sci").length < 2
    ) {
      recommendedCoursesNextTerm.push({
        courseName: "Science with lab (NCAA D1 approved)",
        priority: "HIGH",
        reason:
          "Closes science gap toward EMS subset requirement. " +
          "Source: NCAA IE Brochure 2025-26.",
        closesSubset: true,
      });
    }
    if (missingTotal > 0 && missingEngMathSci === 0) {
      recommendedCoursesNextTerm.push({
        courseName: "NCAA D1 core course (any approved category)",
        priority: "MEDIUM",
        reason:
          "EMS subset is met. Remaining missing cores can be any approved D1 category. " +
          "Source: NCAA Bylaw 14.3.",
        closesSubset: false,
      });
    }
  }

  const fallbackPathway: FallbackPathway | null =
    riskBand === "LOCKED"
      ? completedTotal >= 8 && completedEngMathSci >= 6
        ? {
            primary: "NCAA_DII",
            rationale:
              "The Division I 10/7 lock-in window has closed, but this student has enough completed core work to immediately evaluate a Division II eligibility path. Keep the next conversation focused on viable college athletics options, not loss.",
            nextActions: [
              {
                code: "pivot_to_d2_register_eligibility_center",
                deadline: "2026-05-30",
              },
              ...(missingTotal <= 2
                ? [
                    {
                      code: "evaluate_post_grad_exception",
                      deadline: "2026-06-15",
                    },
                  ]
                : []),
            ],
          }
        : {
            primary: "JUCO",
            rationale:
              "The Division I 10/7 lock-in window has closed and the current core-course deficit is too large for a direct DI recovery plan. A JUCO pathway can preserve athletic identity while academic eligibility is rebuilt.",
            nextActions: [
              {
                code: "schedule_juco_pathway_conversation",
                deadline: "2026-05-30",
              },
              ...(missingTotal <= 2
                ? [
                    {
                      code: "evaluate_post_grad_exception",
                      deadline: "2026-06-15",
                    },
                  ]
                : []),
            ],
          }
      : null;

  return {
    applicable: true,
    framework: "ncaa_d1_10_7",
    lockInDate: seventhSemesterStart,
    lockInDateBasis,
    provisionalFlag,
    daysToLock,
    pastLock,
    requiredTotal: REQUIRED_TOTAL,
    requiredEngMathSci: REQUIRED_EMS,
    completedTotal,
    completedEngMathSci,
    missingTotal,
    missingEngMathSci,
    riskBand,
    evidenceTier: provisionalFlag ? "Provisional" : "Deterministic",
    agFailureDualFlags,
    unclassifiedCourses,
    recommendedCoursesNextTerm,
    fallbackPathway,
    derivation: {
      lockInDateExplanation,
      daysToLockExplanation,
      riskBandExplanation,
      completedCountExplanation,
      sourceAuthority: "NCAA Bylaw 14.3 / NCAA IE Brochure 2025-26 / D1 Calculation Specification v0.1 §7",
      sourceUrl: "https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/",
    },
    computedAt,
  };
}

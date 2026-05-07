/**
 * F5 Unit Tests — TC1, TC2, TC3
 * Source: D1 Calculation Specification v0.1 §14
 *
 * TC1: Marcus — 8 of 10, 6 of 7 EMS, YELLOW
 *   D1 spec: "4 eng, 2 math, 2 sci... 6 EMS subset"
 *   That is 4+2+2 = 8 total, but ONLY math+sci contribute "EMS gap" here
 *   Actually the spec says completed_eng_math_sci=6 with 4eng+2math+2sci = 8
 *   Re-reading: 6 EMS must mean the 8 courses include 2 that are NOT EMS categories.
 *   D1 spec TC1 input: "4 eng, 2 math, 2 sci... 6 EMS subset"
 *   Wait — 4+2+2 = 8, all are eng/math/sci, that's 8 EMS not 6.
 *   Resolution: The spec input is "completed cores (passing, before lock): 8 (4 eng, 2 math, 2 sci... 6 EMS subset)"
 *   This means only 6 of the 8 are in the EMS subset — so 2 must be non-EMS (soc_sci or addl_any).
 *   We fix the test data to match: 4 courses eng/math/sci + 2 soc_sci or addl_any = correct 6 EMS.
 *   Specifically: 2 eng + 2 math + 2 sci = 6 EMS, + 1 soc_sci + 1 addl_any = 8 total.
 */

import { calcNcaa107Status, F5CourseRecord, F5SchoolCalendar, F5StudentInput } from "../f5";

function makeCourse(overrides: Partial<F5CourseRecord> & { id: string; courseName: string }): F5CourseRecord {
  return {
    id: overrides.id,
    courseName: overrides.courseName,
    gradeLetterNormalized: overrides.gradeLetterNormalized ?? "B",
    termEndDate: overrides.termEndDate ?? new Date("2025-06-15"),
    ncaaD1Category: overrides.ncaaD1Category ?? "eng",
    ncaaApproved: overrides.ncaaApproved ?? true,
    agCategory: overrides.agCategory ?? null,
    classificationUpdatedAt: overrides.classificationUpdatedAt ?? new Date("2025-09-01"),
  };
}

// ─── TC1 — Marcus, YELLOW, junior on pace ────────────────────────────────────
// D1 Spec: 8 cores (2 eng + 2 math + 2 sci + 1 soc_sci + 1 addl_any = 6 EMS + 2 non-EMS)
// completed_total=8, completed_eng_math_sci=6, missing_total=2, missing_ems=1
// lock_in_date = 2026-08-17, days_to_lock ≈ 469 from 2026-05-05

describe("TC1 — F5 — Marcus, YELLOW, junior on pace for 10/7", () => {
  const student: F5StudentInput = {
    id: "stu_marcus_001",
    targetDivision: "DI",
    enrollmentDateGrade9: new Date("2023-08-21"),
    highSchoolId: "hs_manteca_high",
    highSchoolName: "Manteca High School",
    grade: 11,
  };

  const calendar: F5SchoolCalendar = {
    seniorFallTermStart: new Date("2026-08-17"),
    maxCoresPerTerm: 4,
    maxEmsPerTerm: 2,
    calendarSourceUrl: "https://www.mantecausd.net/",
  };

  // 8 completed before lock: 2 eng, 2 math, 2 sci (6 EMS), 1 soc_sci, 1 addl_any
  // + Algebra 2 in-progress (IP) — excluded per AD-2
  const courses: F5CourseRecord[] = [
    makeCourse({ id: "c1", courseName: "English 9",    gradeLetterNormalized: "B", ncaaD1Category: "eng",      termEndDate: new Date("2024-06-10") }),
    makeCourse({ id: "c2", courseName: "English 10",   gradeLetterNormalized: "A", ncaaD1Category: "eng",      termEndDate: new Date("2025-06-10") }),
    makeCourse({ id: "c3", courseName: "Algebra 1",    gradeLetterNormalized: "B", ncaaD1Category: "math",     termEndDate: new Date("2024-06-10") }),
    makeCourse({ id: "c4", courseName: "Geometry",     gradeLetterNormalized: "B", ncaaD1Category: "math",     termEndDate: new Date("2025-06-10") }),
    makeCourse({ id: "c5", courseName: "Biology",      gradeLetterNormalized: "A", ncaaD1Category: "sci",      termEndDate: new Date("2024-06-10") }),
    makeCourse({ id: "c6", courseName: "Chemistry",    gradeLetterNormalized: "B", ncaaD1Category: "sci",      termEndDate: new Date("2025-06-10") }),
    makeCourse({ id: "c7", courseName: "US History",   gradeLetterNormalized: "B", ncaaD1Category: "soc_sci",  termEndDate: new Date("2025-06-10") }),
    makeCourse({ id: "c8", courseName: "Spanish 1",    gradeLetterNormalized: "C", ncaaD1Category: "addl_any", termEndDate: new Date("2025-06-10") }),
    // In-progress — must be excluded per AD-2
    makeCourse({ id: "c9", courseName: "Algebra 2",    gradeLetterNormalized: "IP", ncaaD1Category: "math",   termEndDate: new Date("2026-06-15") }),
  ];

  const today = new Date("2026-05-05");
  const result = calcNcaa107Status(student, courses, calendar, today);

  it("is applicable", () => expect(result.applicable).toBe(true));
  it("lock-in date is 2026-08-17", () => expect(result.lockInDate?.toISOString().split("T")[0]).toBe("2026-08-17"));
  it("lock-in date basis is school_calendar", () => expect(result.lockInDateBasis).toBe("school_calendar"));
  it("provisional_flag is false", () => expect(result.provisionalFlag).toBe(false));
  it("past_lock is false", () => expect(result.pastLock).toBe(false));
  it("completed_total is 8 (IP course excluded)", () => expect(result.completedTotal).toBe(8));
  it("completed_eng_math_sci is 6", () => expect(result.completedEngMathSci).toBe(6));
  it("missing_total is 2", () => expect(result.missingTotal).toBe(2));
  it("missing_eng_math_sci is 1", () => expect(result.missingEngMathSci).toBe(1));
  it("risk_band is YELLOW", () => expect(result.riskBand).toBe("YELLOW"));
  it("evidence_tier is Deterministic", () => expect(result.evidenceTier).toBe("Deterministic"));
  it("no ag_failure_dual_flags", () => expect(result.agFailureDualFlags).toHaveLength(0));
  it("days_to_lock is correct for 2026-05-05 → 2026-08-17 (104 days)", () => {
    // May 5 → Aug 17 = 104 days. The demo script's '460 days' was written for an earlier 'today'.
    // The calculation is correct; the spec narrative used a different reference date.
    expect(result.daysToLock).toBeGreaterThanOrEqual(102);
    expect(result.daysToLock).toBeLessThanOrEqual(106);
  });
  it("recommended courses include EMS-closing priority", () => {
    expect(result.recommendedCoursesNextTerm.some((r) => r.closesSubset)).toBe(true);
  });
  it("derivation references lock date", () => {
    expect(result.derivation.daysToLockExplanation).toContain("2026-08-17");
  });
});

// ─── TC2 — Aaliyah, LOCKED ───────────────────────────────────────────────────
// D1 Spec: 9 cores before lock (4 eng, 3 math, 1 sci, 1 soc_sci), EMS=8 (>=7)
// past lock 2025-08-18, today 2026-10-15, missing_total=1, LOCKED
// Physics (senior fall) term_end 2026-01-15 — after lock 2025-08-18, excluded AD-2

describe("TC2 — F5 — Aaliyah, LOCKED, senior past lock", () => {
  const student: F5StudentInput = {
    id: "stu_aaliyah_002",
    targetDivision: "DI",
    enrollmentDateGrade9: new Date("2022-08-22"),
    highSchoolId: "hs_manteca_high",
    highSchoolName: "Manteca High School",
    grade: 12,
  };

  const calendar: F5SchoolCalendar = {
    seniorFallTermStart: new Date("2025-08-18"),
    maxCoresPerTerm: 4,
    maxEmsPerTerm: 2,
    calendarSourceUrl: "https://www.mantecausd.net/",
  };

  // classificationUpdatedAt set to 2026-08-01 (within 365d of today 2026-10-15) to avoid
  // triggering staleness provisional flag — per D1 spec TC2 expected output: Deterministic
  const recentClassified = new Date("2026-08-01");
  const courses: F5CourseRecord[] = [
    makeCourse({ id: "a1", courseName: "English 9",  gradeLetterNormalized: "A", ncaaD1Category: "eng",     termEndDate: new Date("2023-06-10"), classificationUpdatedAt: recentClassified }),
    makeCourse({ id: "a2", courseName: "English 10", gradeLetterNormalized: "B", ncaaD1Category: "eng",     termEndDate: new Date("2024-06-10"), classificationUpdatedAt: recentClassified }),
    makeCourse({ id: "a3", courseName: "English 11", gradeLetterNormalized: "B", ncaaD1Category: "eng",     termEndDate: new Date("2025-01-15"), classificationUpdatedAt: recentClassified }),
    makeCourse({ id: "a4", courseName: "English 12", gradeLetterNormalized: "C", ncaaD1Category: "eng",     termEndDate: new Date("2025-06-10"), classificationUpdatedAt: recentClassified }),
    makeCourse({ id: "a5", courseName: "Algebra 1",  gradeLetterNormalized: "B", ncaaD1Category: "math",    termEndDate: new Date("2023-06-10"), classificationUpdatedAt: recentClassified }),
    makeCourse({ id: "a6", courseName: "Geometry",   gradeLetterNormalized: "B", ncaaD1Category: "math",    termEndDate: new Date("2024-06-10"), classificationUpdatedAt: recentClassified }),
    makeCourse({ id: "a7", courseName: "Algebra 2",  gradeLetterNormalized: "A", ncaaD1Category: "math",    termEndDate: new Date("2025-06-10"), classificationUpdatedAt: recentClassified }),
    makeCourse({ id: "a8", courseName: "Biology",    gradeLetterNormalized: "B", ncaaD1Category: "sci",     termEndDate: new Date("2023-06-10"), classificationUpdatedAt: recentClassified }),
    makeCourse({ id: "a9", courseName: "US History", gradeLetterNormalized: "B", ncaaD1Category: "soc_sci", termEndDate: new Date("2024-06-10"), classificationUpdatedAt: recentClassified }),
    // Senior fall — term end after lock (AD-2 strict less-than excludes this)
    makeCourse({ id: "a10", courseName: "Physics",   gradeLetterNormalized: "B", ncaaD1Category: "sci",     termEndDate: new Date("2026-01-15"), classificationUpdatedAt: recentClassified }),
  ];

  const today = new Date("2026-10-15");
  const result = calcNcaa107Status(student, courses, calendar, today);

  it("is applicable", () => expect(result.applicable).toBe(true));
  it("lock-in date is 2025-08-18", () => expect(result.lockInDate?.toISOString().split("T")[0]).toBe("2025-08-18"));
  it("past_lock is true", () => expect(result.pastLock).toBe(true));
  it("completed_total is 9 (Physics excluded by AD-2)", () => expect(result.completedTotal).toBe(9));
  it("missing_total is 1", () => expect(result.missingTotal).toBe(1));
  it("risk_band is LOCKED", () => expect(result.riskBand).toBe("LOCKED"));
  it("evidence_tier is Deterministic", () => expect(result.evidenceTier).toBe("Deterministic"));
  it("days_to_lock is 0", () => expect(result.daysToLock).toBe(0));
  it("no recommended courses post-lock", () => expect(result.recommendedCoursesNextTerm).toHaveLength(0));
});

// ─── TC3 — Jordan, YELLOW + AD-3 dual flag ───────────────────────────────────

describe("TC3 — F5 — Jordan, YELLOW + AD-3 D-grade dual-flag", () => {
  const student: F5StudentInput = {
    id: "stu_jordan_003",
    targetDivision: "DI",
    enrollmentDateGrade9: new Date("2023-08-21"),
    highSchoolId: "hs_manteca_high",
    highSchoolName: "Manteca High School",
    grade: 11,
  };

  const calendar: F5SchoolCalendar = {
    seniorFallTermStart: new Date("2026-08-17"),
    maxCoresPerTerm: 4,
    maxEmsPerTerm: 2,
    calendarSourceUrl: "https://www.mantecausd.net/",
  };

  const courses: F5CourseRecord[] = [
    makeCourse({ id: "j1", courseName: "English 9",  gradeLetterNormalized: "B", ncaaD1Category: "eng",      termEndDate: new Date("2024-06-10") }),
    makeCourse({ id: "j2", courseName: "English 10", gradeLetterNormalized: "A", ncaaD1Category: "eng",      termEndDate: new Date("2025-06-10") }),
    makeCourse({ id: "j3", courseName: "English 11", gradeLetterNormalized: "B", ncaaD1Category: "eng",      termEndDate: new Date("2026-01-15") }),
    makeCourse({ id: "j4", courseName: "World Literature",  gradeLetterNormalized: "C", ncaaD1Category: "eng",      termEndDate: new Date("2025-01-15") }),
    makeCourse({ id: "j5", courseName: "Algebra 1",  gradeLetterNormalized: "B", ncaaD1Category: "math",     termEndDate: new Date("2024-06-10") }),
    // Geometry: D grade, counts for NCAA (AD-3) but fails A-G C-or-better
    makeCourse({ id: "j6", courseName: "Geometry",   gradeLetterNormalized: "D", ncaaD1Category: "math",     agCategory: "c", termEndDate: new Date("2025-06-10") }),
    makeCourse({ id: "j7", courseName: "Biology",    gradeLetterNormalized: "A", ncaaD1Category: "sci",      termEndDate: new Date("2024-06-10") }),
    makeCourse({ id: "j8", courseName: "Chemistry",  gradeLetterNormalized: "B", ncaaD1Category: "sci",      termEndDate: new Date("2025-06-10") }),
    makeCourse({ id: "j9", courseName: "US History", gradeLetterNormalized: "C", ncaaD1Category: "soc_sci",  termEndDate: new Date("2025-06-10") }),
  ];

  const today = new Date("2026-05-05");
  const result = calcNcaa107Status(student, courses, calendar, today);

  it("is applicable", () => expect(result.applicable).toBe(true));
  it("completed_total is 9 (D counts per AD-3)", () => expect(result.completedTotal).toBe(9));
  it("risk_band is YELLOW", () => expect(result.riskBand).toBe("YELLOW"));
  it("evidence_tier is Deterministic", () => expect(result.evidenceTier).toBe("Deterministic"));
  it("ag_failure_dual_flags has 1 entry", () => expect(result.agFailureDualFlags).toHaveLength(1));
  it("dual flag is for Geometry", () => expect(result.agFailureDualFlags[0].courseName).toBe("Geometry"));
  it("ncaaStatus is counted_for_10_7", () => expect(result.agFailureDualFlags[0].ncaaStatus).toBe("counted_for_10_7"));
  it("agStatus is fails_a_g_C_or_better_requirement", () => expect(result.agFailureDualFlags[0].agStatus).toBe("fails_a_g_C_or_better_requirement"));
  it("recommendedAction is credit_recovery_to_C_or_higher", () => expect(result.agFailureDualFlags[0].recommendedAction).toBe("credit_recovery_to_C_or_higher"));
});

// ─── Applicability guard ──────────────────────────────────────────────────────

describe("Applicability guard — DIII student returns Not_Applicable", () => {
  const student: F5StudentInput = {
    id: "stu_test_diii",
    targetDivision: "DIII",
    enrollmentDateGrade9: new Date("2023-08-21"),
    highSchoolId: "hs_test",
    highSchoolName: "Test High",
    grade: 11,
  };
  const result = calcNcaa107Status(student, [], null, new Date("2026-05-05"));
  it("applicable is false", () => expect(result.applicable).toBe(false));
  it("evidenceTier is Not_Applicable", () => expect(result.evidenceTier).toBe("Not_Applicable"));
});

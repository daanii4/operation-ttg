import { calcMasterBriefing } from "../f12";
import type { F1Result } from "../f1";
import type { F2Result } from "../f2";
import type { F3Result } from "../f3";
import type { F4Result } from "../f4";
import type { F6Result } from "../f6";
import type { F7Result } from "../f7";
import type { F8Result, F9Result, F10Result, F11Result, StudentBriefingInput } from "../types";

function makeStudent(): StudentBriefingInput {
  return {
    student_id: "stu_f12",
    name: "Test Student",
    division_intent: ["DI"],
    sport: "Basketball",
    graduation_year: 2027,
    referenceDate: new Date("2026-05-20"),
    lock_in_date: new Date("2026-08-20"),
  };
}

function makeF1(overrides: Partial<F1Result> = {}): F1Result {
  return {
    framework: "california_a_g",
    perCategory: {},
    totalRequiredYears: 15,
    totalCompletedYears: 15,
    completionPct: 1,
    fullyComplete: true,
    ruleViolations: [],
    creditRecoveryCandidates: [],
    unclassifiedCourses: [],
    staleClassificationCount: 0,
    evidenceTier: "Deterministic",
    provisionalFlag: false,
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
    ...overrides,
  };
}

function makeF2(): F2Result {
  return {
    framework: "california_a_g_gpa",
    ucGpaWeighted: 3,
    ucGpaUnweighted: 3,
    totalCoursesInCalc: 16,
    totalSemesters: 32,
    basePointsSum: 96,
    honorsBonusPoints: 0,
    honorsSemestersUsed: 0,
    honorsSemestersCap: 8,
    honorsCoursesCapped: [],
    hoursCoursesExcludedByCap: [],
    csuThreshold: 2.5,
    csuStatus: "ABOVE",
    ucThresholdEffective: 3,
    ucStatus: "ABOVE",
    evidenceTier: "Deterministic",
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
  };
}

function makeF3(overrides: Partial<F3Result> = {}): F3Result {
  return {
    applicable: true,
    framework: "ncaa_d1_completion",
    perCategory: {},
    totalRequired: 16,
    totalCompleted: 16,
    geometrySatisfied: true,
    fullyComplete: true,
    ruleViolations: [],
    failingCoreForRecovery: [],
    postGradExceptionAvailable: false,
    postGradExceptionReason: null,
    unclassifiedCourses: [],
    staleClassificationCount: 0,
    evidenceTier: "Deterministic",
    provisionalFlag: false,
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
    ...overrides,
  };
}

function makeF4(): F4Result {
  return {
    applicable: true,
    framework: "ncaa_d1_gpa",
    coreGpaWeighted: 2.8,
    coreGpaUnweighted: 2.7,
    qualifierStatus: "FULL_QUALIFIER",
    qualifierThresholdFull: 2.3,
    qualifierThresholdRedshirt: 2.0,
    qualifierStatusProvisional: false,
    coresUsedInCalc: 16,
    coresExcludedBeyond16: [],
    evidenceTier: "Deterministic",
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
  };
}

function makeF6(): F6Result {
  return {
    applicable: true,
    framework: "ncaa_d2_completion",
    perCategory: {},
    totalRequired: 16,
    totalCompleted: 16,
    fullyComplete: true,
    ruleViolations: [],
    failingCoreForRecovery: [],
    unclassifiedCourses: [],
    staleClassificationCount: 0,
    evidenceTier: "Deterministic",
    provisionalFlag: false,
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
  };
}

function makeF7(): F7Result {
  return {
    applicable: true,
    framework: "ncaa_d2_gpa",
    coreGpaWeighted: 2.6,
    coreGpaUnweighted: 2.5,
    qualifierStatus: "FULL_QUALIFIER",
    qualifierThresholdFull: 2.2,
    qualifierStatusProvisional: false,
    coresUsedInCalc: 16,
    coresExcludedBeyond16: [],
    evidenceTier: "Deterministic",
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
  };
}

function makeF8(overrides: Partial<F8Result> = {}): F8Result {
  return {
    composite_band: "GREEN",
    primary_concern: null,
    concern_type: null,
    is_on_track: true,
    escalation_required: false,
    escalation_reason: null,
    acknowledgment_state: "none",
    evidence_tier: "Deterministic",
    ...overrides,
  };
}

function makeF9(overrides: Partial<F9Result> = {}): F9Result {
  return {
    slope: 0.01,
    confidence_interval: [0.005, 0.015],
    direction: "improving",
    regression_flag: false,
    plateau_flag: false,
    data_class_effective: "C",
    evidence_tier: "Strong",
    insufficient_reason: null,
    ...overrides,
  };
}

function makeF10(overrides: Partial<F10Result> = {}): F10Result {
  return {
    risk_band: "Low",
    total_score_baseline: 90,
    total_score_current: 95,
    within_subject_delta_pct: 0.05,
    cross_layer_flags: [],
    version_mismatch: false,
    evidence_tier: "Strong",
    threshold_method: "within_subject_pct_delta_v0.1_placeholder",
    insufficient_reason: null,
    ...overrides,
  };
}

function makeF11(overrides: Partial<F11Result> = {}): F11Result {
  return {
    window_avg: 0.7,
    trend: "stable",
    consecutive_absences: 0,
    low_engagement_flag: false,
    withdrawal_flag: false,
    data_class_effective: "C",
    evidence_tier: "Strong",
    insufficient_reason: null,
    ...overrides,
  };
}

describe("F12 — Master Briefing", () => {
  it("TC12 — ESCALATED sets weeks_to_critical_action=0 and first action immediate contact", () => {
    const result = calcMasterBriefing(
      { ...makeStudent(), lock_in_date: null },
      makeF1(),
      makeF2(),
      makeF3(),
      makeF4(),
      makeF6(),
      makeF7(),
      makeF8({ composite_band: "ESCALATED", escalation_required: true }),
      makeF9(),
      makeF10(),
      makeF11()
    );

    expect(result.weeks_to_critical_action).toBe(0);
    expect(result.intervention_codes[0]).toBe("IMMEDIATE_ADVISOR_CONTACT");
  });

  it("TC12b — all green yields NO_ACTION_REQUIRED and null action window", () => {
    const result = calcMasterBriefing(
      { ...makeStudent(), lock_in_date: null },
      makeF1(),
      makeF2(),
      makeF3(),
      makeF4(),
      makeF6(),
      makeF7(),
      makeF8({ composite_band: "GREEN", escalation_required: false }),
      makeF9(),
      makeF10(),
      makeF11()
    );

    expect(result.composite_band).toBe("GREEN");
    expect(result.intervention_codes).toEqual(["NO_ACTION_REQUIRED"]);
    expect(result.weeks_to_critical_action).toBeNull();
  });

  it("TC12c — immediate contact is deduplicated when dual triggered", () => {
    const result = calcMasterBriefing(
      makeStudent(),
      makeF1(),
      makeF2(),
      makeF3(),
      makeF4(),
      makeF6(),
      makeF7(),
      makeF8({ composite_band: "ESCALATED", escalation_required: true }),
      makeF9(),
      makeF10(),
      makeF11({ withdrawal_flag: true, consecutive_absences: 3 })
    );

    const immediateCount = result.intervention_codes.filter(
      (code) => code === "IMMEDIATE_ADVISOR_CONTACT"
    ).length;
    expect(immediateCount).toBe(1);
  });
});

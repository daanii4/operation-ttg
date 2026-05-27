import type { PrismaClient } from "@prisma/client";
import { calcEligibilitySummary } from "../f8";
import type { F1Result } from "../f1";
import type { F2Result } from "../f2";
import type { F3Result } from "../f3";
import type { F4Result } from "../f4";
import type { F6Result } from "../f6";
import type { F7Result } from "../f7";
import type { StudentInput } from "../types";

function makeBaseStudent(): StudentInput {
  return {
    id: "stu_f8_test",
    enrollmentDateGrade9: new Date("2023-08-21"),
    highSchoolId: "hs_test",
    highSchoolName: "Test High",
    grade: 11,
    targetDivision: "DI",
    state: "CA",
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

function makeF2(overrides: Partial<F2Result> = {}): F2Result {
  return {
    framework: "california_a_g_gpa",
    ucGpaWeighted: 3.1,
    ucGpaUnweighted: 3.0,
    totalCoursesInCalc: 16,
    totalSemesters: 32,
    basePointsSum: 96,
    honorsBonusPoints: 4,
    honorsSemestersUsed: 4,
    honorsSemestersCap: 8,
    honorsCoursesCapped: [],
    hoursCoursesExcludedByCap: [],
    csuThreshold: 2.5,
    csuStatus: "ABOVE",
    ucThresholdEffective: 3.0,
    ucStatus: "ABOVE",
    evidenceTier: "Deterministic",
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
    ...overrides,
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

function makeF4(overrides: Partial<F4Result> = {}): F4Result {
  return {
    applicable: true,
    framework: "ncaa_d1_gpa",
    coreGpaWeighted: 2.6,
    coreGpaUnweighted: 2.5,
    qualifierStatus: "FULL_QUALIFIER",
    qualifierThresholdFull: 2.3,
    qualifierThresholdRedshirt: 2.0,
    qualifierStatusProvisional: false,
    coresUsedInCalc: 16,
    coresExcludedBeyond16: [],
    evidenceTier: "Deterministic",
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
    ...overrides,
  };
}

function makeF6(overrides: Partial<F6Result> = {}): F6Result {
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
    ...overrides,
  };
}

function makeF7(overrides: Partial<F7Result> = {}): F7Result {
  return {
    applicable: true,
    framework: "ncaa_d2_gpa",
    coreGpaWeighted: 2.5,
    coreGpaUnweighted: 2.4,
    qualifierStatus: "FULL_QUALIFIER",
    qualifierThresholdFull: 2.2,
    qualifierStatusProvisional: false,
    coresUsedInCalc: 16,
    coresExcludedBeyond16: [],
    evidenceTier: "Deterministic",
    dataSourceClassesConsumed: ["B"],
    computedAt: new Date(),
    ...overrides,
  };
}

function makePrismaMock(findFirstImpl: () => Promise<unknown>): PrismaClient {
  return {
    compositeBandAcknowledgment: {
      findFirst: jest.fn(findFirstImpl),
    },
  } as unknown as PrismaClient;
}

describe("F8 — Composite Eligibility Summary", () => {
  it("TC7 — A-G RED, NCAA GREEN -> composite YELLOW (OQ-F8-1)", async () => {
    const prisma = makePrismaMock(async () => null);

    const result = await calcEligibilitySummary(
      "stu_tc7",
      makeBaseStudent(),
      makeF1({ fullyComplete: false, completionPct: 0.6 }),
      makeF2(),
      makeF3({ fullyComplete: true, totalCompleted: 16 }),
      makeF4({ qualifierStatus: "FULL_QUALIFIER" }),
      makeF6({ fullyComplete: true, totalCompleted: 16 }),
      makeF7({ qualifierStatus: "FULL_QUALIFIER" }),
      prisma
    );

    expect(result.composite_band).toBe("YELLOW");
    expect(result.primary_concern).toBe("a_g_completion");
  });

  it("TC8 — AD-7 stateful RED -> YELLOW -> RED lifecycle", async () => {
    const acknowledgments: Array<{ conditions_snapshot: unknown; acknowledged_at: Date }> = [];
    const prisma = makePrismaMock(async () => {
      if (acknowledgments.length === 0) return null;
      const latest = acknowledgments[acknowledgments.length - 1];
      return {
        id: "ack_1",
        student_id: "stu_tc8",
        advisor_id: "advisor_1",
        band_transition: "RED→YELLOW",
        acknowledged_at: latest.acknowledged_at,
        cryptographic_signature: "abc",
        conditions_snapshot: latest.conditions_snapshot,
      };
    });

    const student = makeBaseStudent();
    const f1 = makeF1();
    const f2 = makeF2();
    const f3 = makeF3({ fullyComplete: false, totalCompleted: 12 }); // D1 closure trigger
    const f4 = makeF4({ qualifierStatus: "FULL_QUALIFIER" });
    const f6 = makeF6();
    const f7 = makeF7();

    const call1 = await calcEligibilitySummary(
      "stu_tc8",
      student,
      f1,
      f2,
      f3,
      f4,
      f6,
      f7,
      prisma
    );
    expect(call1.composite_band).toBe("RED");
    expect(call1.acknowledgment_state).toBe("none");

    acknowledgments.push({
      acknowledged_at: new Date(),
      conditions_snapshot: { f1, f2, f3, f4, f6, f7 },
    });

    const call2 = await calcEligibilitySummary(
      "stu_tc8",
      student,
      f1,
      f2,
      f3,
      f4,
      f6,
      f7,
      prisma
    );
    expect(call2.composite_band).toBe("YELLOW");
    expect(call2.acknowledgment_state).toBe("acknowledged");

    const degradedF3 = makeF3({ fullyComplete: false, totalCompleted: 10 });
    const call3 = await calcEligibilitySummary(
      "stu_tc8",
      student,
      f1,
      f2,
      degradedF3,
      f4,
      f6,
      f7,
      prisma
    );
    expect(call3.composite_band).toBe("RED");
    expect(call3.acknowledgment_state).toBe("re_escalated");
  });
});

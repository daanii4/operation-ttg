export type FrameworkBand = "GREEN" | "YELLOW" | "RED";
export type GpaTrajectory = "improving" | "flat" | "declining";
export type AimsRisk = "STABLE" | "ESCALATED" | "HIGH";

export type HolisticProfile = {
  studentId: string;
  agStatus: FrameworkBand;
  agMissingCount: number;
  projectedCoreGpa: number;
  gpaTrajectory: GpaTrajectory;
  aimsRisk: AimsRisk;
  aimsReason: string | null;
  recommendedAdvisorAction: string;
};

export const HOLISTIC_PROFILES: HolisticProfile[] = [
  {
    studentId: "stu_aaliyah_002",
    agStatus: "RED",
    agMissingCount: 2,
    projectedCoreGpa: 2.1,
    gpaTrajectory: "declining",
    aimsRisk: "HIGH",
    aimsReason: "Exclusivity spike after missed DI lock-in deadline.",
    recommendedAdvisorAction:
      "Pivot to NCAA DII or JUCO pathways; monitor for identity foreclosure.",
  },
  {
    studentId: "stu_jordan_003",
    agStatus: "RED",
    agMissingCount: 1,
    projectedCoreGpa: 2.4,
    gpaTrajectory: "flat",
    aimsRisk: "STABLE",
    aimsReason: null,
    recommendedAdvisorAction:
      "Enroll in summer credit recovery to replace D-grade for A-G compliance.",
  },
  {
    studentId: "stu_marcus_001",
    agStatus: "GREEN",
    agMissingCount: 0,
    projectedCoreGpa: 2.8,
    gpaTrajectory: "improving",
    aimsRisk: "ESCALATED",
    aimsReason: "Negative affectivity elevated despite improving academic trend.",
    recommendedAdvisorAction:
      "Immediate SEL check-in required; acknowledge alert before academic advising.",
  },
  {
    studentId: "stu_maya_004",
    agStatus: "GREEN",
    agMissingCount: 0,
    projectedCoreGpa: 3.6,
    gpaTrajectory: "improving",
    aimsRisk: "STABLE",
    aimsReason: null,
    recommendedAdvisorAction:
      "Continue current curriculum delivery; introduce career exposure.",
  },
  {
    studentId: "stu_deshawn_005",
    agStatus: "GREEN",
    agMissingCount: 0,
    projectedCoreGpa: 3.1,
    gpaTrajectory: "flat",
    aimsRisk: "STABLE",
    aimsReason: null,
    recommendedAdvisorAction: "Maintain course plan and monitor weekly grade checks.",
  },
  {
    studentId: "stu_priya_006",
    agStatus: "GREEN",
    agMissingCount: 0,
    projectedCoreGpa: 3.4,
    gpaTrajectory: "improving",
    aimsRisk: "STABLE",
    aimsReason: null,
    recommendedAdvisorAction: "Keep current eligibility path and enrichment plan.",
  },
  {
    studentId: "stu_isaiah_007",
    agStatus: "YELLOW",
    agMissingCount: 1,
    projectedCoreGpa: 2.3,
    gpaTrajectory: "flat",
    aimsRisk: "ESCALATED",
    aimsReason: "Engagement drop during spring term.",
    recommendedAdvisorAction:
      "Pair summer core recovery with weekly engagement check-ins.",
  },
  {
    studentId: "stu_sofia_008",
    agStatus: "YELLOW",
    agMissingCount: 1,
    projectedCoreGpa: 2.6,
    gpaTrajectory: "improving",
    aimsRisk: "STABLE",
    aimsReason: null,
    recommendedAdvisorAction: "Schedule math and lab science recovery for summer.",
  },
  {
    studentId: "stu_tyrone_009",
    agStatus: "YELLOW",
    agMissingCount: 1,
    projectedCoreGpa: 2.5,
    gpaTrajectory: "flat",
    aimsRisk: "STABLE",
    aimsReason: null,
    recommendedAdvisorAction: "Confirm summer core enrollment before application close.",
  },
  {
    studentId: "stu_destiny_010",
    agStatus: "RED",
    agMissingCount: 3,
    projectedCoreGpa: 2.0,
    gpaTrajectory: "declining",
    aimsRisk: "HIGH",
    aimsReason: "High identity exclusivity and recent attendance concern.",
    recommendedAdvisorAction:
      "Escalate to counselor team; build recovery plan with family and coach.",
  },
  {
    studentId: "stu_jamal_011",
    agStatus: "YELLOW",
    agMissingCount: 1,
    projectedCoreGpa: 2.7,
    gpaTrajectory: "flat",
    aimsRisk: "STABLE",
    aimsReason: null,
    recommendedAdvisorAction: "Add one approved core course before summer close.",
  },
  {
    studentId: "stu_brianna_012",
    agStatus: "GREEN",
    agMissingCount: 0,
    projectedCoreGpa: 3.0,
    gpaTrajectory: "improving",
    aimsRisk: "STABLE",
    aimsReason: null,
    recommendedAdvisorAction:
      "English/Math/Science requirement is met; finish remaining approved cores.",
  },
];

export function getHolisticProfile(studentId: string): HolisticProfile {
  const profile = HOLISTIC_PROFILES.find((item) => item.studentId === studentId);
  if (!profile) {
    return {
      studentId,
      agStatus: "YELLOW",
      agMissingCount: 1,
      projectedCoreGpa: 2.5,
      gpaTrajectory: "flat",
      aimsRisk: "STABLE",
      aimsReason: null,
      recommendedAdvisorAction:
        "Review student manually; synthetic holistic profile is not configured.",
    };
  }
  return profile;
}

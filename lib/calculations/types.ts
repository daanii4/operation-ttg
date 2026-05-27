/**
 * Shared types for F1–F7 calculation functions.
 * F5 has its own types in f5.ts — do not import from here into f5.ts.
 */

export type EvidenceTier =
  | "Deterministic"
  | "Provisional"
  | "Strong"
  | "Moderate"
  | "Weak"
  | "Insufficient"
  | "Not_Applicable";

export type DataSourceClass = "A" | "B" | "C" | "D";

export type CompositeBand = "GREEN" | "YELLOW" | "RED" | "ESCALATED";

export type F8Result = {
  composite_band: CompositeBand;
  primary_concern: string | null;
  concern_type: string | null;
  is_on_track: boolean | null;
  escalation_required: boolean;
  escalation_reason: string | null;
  acknowledgment_state: "none" | "acknowledged" | "re_escalated";
  evidence_tier: EvidenceTier;
};

export type TrajectoryDirection = "improving" | "declining" | "flat_or_uncertain";

export type F9Result = {
  slope: number | null;
  confidence_interval: [number, number] | null;
  direction: TrajectoryDirection | null;
  regression_flag: boolean;
  plateau_flag: boolean;
  data_class_effective: "A" | "B" | "C";
  evidence_tier: EvidenceTier;
  insufficient_reason: string | null;
};

export type AimsRiskBand = "Low" | "Moderate" | "High" | "Insufficient";

export type AimsCrossLayerFlag =
  | "identity_threat_high"
  | "exclusivity_high"
  | "negative_affect_rising"
  | "composite_risk_elevated";

export type F10Result = {
  risk_band: AimsRiskBand;
  total_score_baseline: number | null;
  total_score_current: number | null;
  within_subject_delta_pct: number | null;
  cross_layer_flags: AimsCrossLayerFlag[];
  version_mismatch: boolean;
  evidence_tier: EvidenceTier;
  threshold_method: string;
  insufficient_reason: string | null;
};

export type EngagementType =
  | "practice_attendance"
  | "academic_session"
  | "advisor_contact"
  | "team_activity"
  | "self_report_motivation";

export type EngagementTrend = "rising" | "declining" | "stable" | "insufficient";

export type F11Result = {
  window_avg: number | null;
  trend: EngagementTrend;
  consecutive_absences: number;
  low_engagement_flag: boolean;
  withdrawal_flag: boolean;
  data_class_effective: "A" | "B" | "C";
  evidence_tier: EvidenceTier;
  insufficient_reason: string | null;
};

export type InterventionCode =
  | "IMMEDIATE_ADVISOR_CONTACT"
  | "SCHEDULE_ACADEMIC_SUPPORT"
  | "MONITOR_ENGAGEMENT"
  | "GPA_RECOVERY_PLAN"
  | "AIMS_FOLLOW_UP"
  | "TRANSCRIPT_AUDIT"
  | "D1_PATHWAY_REVIEW"
  | "NO_ACTION_REQUIRED";

export type F12LayerSummary = {
  eligibility: { band: string; flag: string | null };
  gpa: { band: string; flag: string | null };
  trajectory: { direction: TrajectoryDirection | null; regression: boolean };
  aims: { risk_band: AimsRiskBand; flags: AimsCrossLayerFlag[] };
  engagement: { trend: EngagementTrend; withdrawal: boolean; low: boolean };
  composite: { band: CompositeBand; escalation: boolean };
};

export type F12Result = {
  student_id: string;
  composite_band: CompositeBand;
  weeks_to_critical_action: number | null;
  primary_concern: string | null;
  intervention_codes: InterventionCode[];
  layer_summary: F12LayerSummary;
  overall_evidence_tier: EvidenceTier;
  briefing_version: string;
  generated_at: string;
};

export type StudentBriefingInput = {
  student_id: string;
  name: string;
  division_intent: string[];
  sport: string;
  graduation_year: number;
  referenceDate: Date;
  lock_in_date?: Date | null;
};

export interface ClassifiedCourse {
  id: string;
  courseName: string;
  courseNameNormalized: string;
  gradeLetterNormalized: string;
  termEndDate: Date | null;
  academicYear: string;
  termLength: "year" | "semester" | "trimester" | "quarter";
  agCategory: string | null;
  agApproved: boolean;
  ucApprovedHonors: boolean;
  countsLabForAg: boolean;
  countsGeometryForAg: boolean;
  agLanguageCode: string | null;
  preNinthGradeEligible: boolean;
  ncaaD1Category: string | null;
  ncaaD2Category: string | null;
  ncaaApproved: boolean;
  ncaaApprovedHonors: boolean;
  countsGeometryForNcaa: boolean;
  classificationLastVerifiedDate: Date | null;
  dataSourceClass: DataSourceClass;
}

export interface StudentInput {
  id: string;
  enrollmentDateGrade9: Date;
  highSchoolId: string;
  highSchoolName: string;
  grade: number;
  targetDivision: string;
  state: string;
}

export interface RuleViolation {
  category: string;
  rule: string;
  message: string;
  blocking: boolean;
}

export interface CourseRecommendation {
  courseName: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

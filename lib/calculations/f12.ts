import type { F1Result } from "./f1";
import type { F2Result } from "./f2";
import type { F3Result } from "./f3";
import type { F4Result } from "./f4";
import type { F6Result } from "./f6";
import type { F7Result } from "./f7";
import type { F10Result, F11Result, F12Result, F8Result, F9Result, InterventionCode, StudentBriefingInput } from "./types";

function dedupePreserveOrder(values: InterventionCode[]): InterventionCode[] {
  return Array.from(new Set(values));
}

function toQualifierBand(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("non")) return "RED";
  if (normalized.includes("partial") || normalized.includes("redshirt")) return "YELLOW";
  return "GREEN";
}

function deriveWeeksToCriticalAction(
  student: StudentBriefingInput,
  f8: F8Result,
  yellowActionWeeks: number
): number | null {
  if (f8.composite_band === "ESCALATED") return 0;
  if (f8.composite_band === "RED") return 1;
  if (student.lock_in_date) {
    const diffDays = Math.floor((student.lock_in_date.getTime() - student.referenceDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, Math.floor(diffDays / 7));
  }
  if (f8.composite_band === "YELLOW") {
    // THRESHOLD_PENDING_AD5_CALIBRATION → DB key 'f12.yellow_action_weeks' — update via Settings > Thresholds.
    return yellowActionWeeks;
  }
  if (f8.composite_band === "GREEN") return null;
  return null;
}

export interface F12Config {
  /** DB key 'f12.yellow_action_weeks' — update via Settings > Thresholds. */
  yellowActionWeeks?: number;
}

const DEFAULT_YELLOW_ACTION_WEEKS = 4;

export function calcMasterBriefing(
  student: StudentBriefingInput,
  f1: F1Result,
  _f2: F2Result,
  f3: F3Result,
  f4: F4Result,
  f6: F6Result,
  f7: F7Result,
  f8: F8Result,
  f9: F9Result,
  f10: F10Result,
  f11: F11Result,
  config: F12Config = {}
): F12Result {
  const yellowActionWeeks = config.yellowActionWeeks ?? DEFAULT_YELLOW_ACTION_WEEKS;
  const codes: InterventionCode[] = [];
  if (f8.escalation_required) codes.push("IMMEDIATE_ADVISOR_CONTACT");
  if (f8.composite_band === "RED" && !f8.escalation_required) codes.push("D1_PATHWAY_REVIEW");
  if (f9.regression_flag) codes.push("GPA_RECOVERY_PLAN");
  if (f11.withdrawal_flag) codes.push("IMMEDIATE_ADVISOR_CONTACT");
  if (f10.risk_band === "High") codes.push("AIMS_FOLLOW_UP");
  if (f11.low_engagement_flag && !f11.withdrawal_flag) codes.push("MONITOR_ENGAGEMENT");
  if (f9.evidence_tier === "Insufficient") codes.push("TRANSCRIPT_AUDIT");
  if (f1.creditRecoveryCandidates?.length > 0) codes.push("SCHEDULE_ACADEMIC_SUPPORT");
  if (codes.length === 0) codes.push("NO_ACTION_REQUIRED");

  const intervention_codes = dedupePreserveOrder(codes);
  const weeks_to_critical_action = deriveWeeksToCriticalAction(student, f8, yellowActionWeeks);

  const evidenceTiers = [f1.evidenceTier, f3.evidenceTier, f4.evidenceTier, f6.evidenceTier, f7.evidenceTier, f9.evidence_tier, f10.evidence_tier, f11.evidence_tier];
  const overall_evidence_tier =
    evidenceTiers.includes("Insufficient")
      ? "Insufficient"
      : evidenceTiers.includes("Provisional")
        ? "Provisional"
        : "Deterministic";

  return {
    student_id: student.student_id,
    composite_band: f8.composite_band,
    weeks_to_critical_action,
    primary_concern: f8.primary_concern,
    intervention_codes,
    layer_summary: {
      eligibility: {
        band: f3.fullyComplete && f6.fullyComplete ? "GREEN" : "RED",
        flag: f1.creditRecoveryCandidates.length > 0 ? "credit_recovery_candidates" : null,
      },
      gpa: {
        band: toQualifierBand(f4.qualifierStatus) === "RED" || toQualifierBand(f7.qualifierStatus) === "RED" ? "RED" : "GREEN",
        flag: toQualifierBand(f4.qualifierStatus) === "RED" ? "d1_non_qualifier" : null,
      },
      trajectory: {
        direction: f9.direction,
        regression: f9.regression_flag,
      },
      aims: {
        risk_band: f10.risk_band,
        flags: f10.cross_layer_flags,
      },
      engagement: {
        trend: f11.trend,
        withdrawal: f11.withdrawal_flag,
        low: f11.low_engagement_flag,
      },
      composite: {
        band: f8.composite_band,
        escalation: f8.escalation_required,
      },
    },
    overall_evidence_tier,
    briefing_version: "v0.1",
    generated_at: student.referenceDate.toISOString(),
  };
}

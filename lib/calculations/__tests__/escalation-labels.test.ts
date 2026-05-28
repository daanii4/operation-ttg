/**
 * Sprint 6 / Workstream A4 — guards the escalation + display label tables.
 *
 * The runtime guard (`escalationLabel(...)`) is what prevents raw machine
 * codes from reaching the advisor UI. These tests pin the contract so a
 * future change that removes the fallback or ships a code without a label
 * fails CI before the regression hits the build.
 */

import {
  ESCALATION_LABELS,
  escalationLabel,
} from "../escalation-labels";
import {
  AIMS_FLAG_LABELS,
  AIMS_RISK_LABELS,
  ENGAGEMENT_TREND_LABELS,
  EVIDENCE_TIER_LABELS,
  TRAJECTORY_DIRECTION_LABELS,
  aimsFlagLabel,
  aimsRiskLabel,
  displayLabel,
  engagementTrendLabel,
  evidenceTierLabel,
  trajectoryDirectionLabel,
} from "../display-labels";

describe("escalation-labels", () => {
  it("includes the unknown fallback", () => {
    expect(ESCALATION_LABELS.unknown).toBeTruthy();
  });

  it("covers every F8 escalation reason produced by the calc layer", () => {
    const f8Reasons = [
      "f5_lock_in",
      "ncaa_gpa_non_qualifier",
      "d1_closure",
      "d1_gpa_below_partial",
      "d2_closure",
      "a_g_completion_deficit",
      "dual_flag_critical",
    ];
    for (const code of f8Reasons) {
      expect(ESCALATION_LABELS[code]).toBeTruthy();
    }
  });

  it("covers every F12 primary concern produced by the calc layer", () => {
    const f12Concerns = [
      "a_g_completion",
      "a_g_gpa",
      "ncaa_core_completion",
      "ncaa_gpa_trajectory",
      "engagement_withdrawal",
      "aims_high_risk",
      "gpa_regression",
    ];
    for (const code of f12Concerns) {
      expect(ESCALATION_LABELS[code]).toBeTruthy();
    }
  });

  it("covers re-escalation acknowledgment state", () => {
    expect(ESCALATION_LABELS.re_escalated_after_ack).toBeTruthy();
  });

  it("escalationLabel falls back to the unknown message for missing codes", () => {
    expect(escalationLabel("not_a_real_code")).toBe(ESCALATION_LABELS.unknown);
  });

  it("escalationLabel falls back to the unknown message for nullish input", () => {
    expect(escalationLabel(null)).toBe(ESCALATION_LABELS.unknown);
    expect(escalationLabel(undefined)).toBe(ESCALATION_LABELS.unknown);
    expect(escalationLabel("")).toBe(ESCALATION_LABELS.unknown);
  });
});

describe("display-labels", () => {
  it("trajectory directions map to human strings", () => {
    expect(TRAJECTORY_DIRECTION_LABELS.improving).toBe("Improving");
    expect(TRAJECTORY_DIRECTION_LABELS.declining).toBe("Declining");
    expect(TRAJECTORY_DIRECTION_LABELS.flat_or_uncertain).toBe("Flat / Uncertain");
    expect(TRAJECTORY_DIRECTION_LABELS.insufficient).toBe("Insufficient data");
  });

  it("AIMS risk bands map to human strings", () => {
    expect(AIMS_RISK_LABELS.Low).toBe("Low risk");
    expect(AIMS_RISK_LABELS.Moderate).toBe("Moderate risk");
    expect(AIMS_RISK_LABELS.High).toBe("High risk");
    expect(AIMS_RISK_LABELS.Insufficient).toBe("Insufficient data");
  });

  it("AIMS cross-layer flags map to human strings", () => {
    expect(AIMS_FLAG_LABELS.identity_threat_high).toBeTruthy();
    expect(AIMS_FLAG_LABELS.exclusivity_high).toBeTruthy();
    expect(AIMS_FLAG_LABELS.negative_affect_rising).toBeTruthy();
    expect(AIMS_FLAG_LABELS.composite_risk_elevated).toBeTruthy();
  });

  it("engagement trends map to human strings", () => {
    expect(ENGAGEMENT_TREND_LABELS.rising).toBe("Improving");
    expect(ENGAGEMENT_TREND_LABELS.declining).toBe("Declining");
    expect(ENGAGEMENT_TREND_LABELS.stable).toBe("Stable");
    expect(ENGAGEMENT_TREND_LABELS.insufficient).toBe("Insufficient data");
  });

  it("evidence tiers map to human strings", () => {
    expect(EVIDENCE_TIER_LABELS.Deterministic).toBe("Verified data");
    expect(EVIDENCE_TIER_LABELS.Provisional).toBe("Provisional — mixed sources");
    expect(EVIDENCE_TIER_LABELS.Insufficient).toBe("Insufficient data");
  });

  it("displayLabel returns '—' for unknown / nullish input", () => {
    expect(displayLabel(TRAJECTORY_DIRECTION_LABELS, null)).toBe("—");
    expect(displayLabel(TRAJECTORY_DIRECTION_LABELS, undefined)).toBe("—");
    expect(displayLabel(TRAJECTORY_DIRECTION_LABELS, "")).toBe("—");
    expect(displayLabel(TRAJECTORY_DIRECTION_LABELS, "not_a_value")).toBe("—");
  });

  it("typed helpers produce the right value", () => {
    expect(trajectoryDirectionLabel("improving")).toBe("Improving");
    expect(aimsRiskLabel("High")).toBe("High risk");
    expect(aimsFlagLabel("identity_threat_high")).toBe(
      "Identity threat signal elevated"
    );
    expect(engagementTrendLabel("declining")).toBe("Declining");
    expect(evidenceTierLabel("Deterministic")).toBe("Verified data");
  });
});

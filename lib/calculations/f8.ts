import type { PrismaClient } from "@prisma/client";
import type { F1Result } from "./f1";
import type { F2Result } from "./f2";
import type { F3Result } from "./f3";
import type { F4Result } from "./f4";
import type { F6Result } from "./f6";
import type { F7Result } from "./f7";
import type { CompositeBand, F8Result, StudentInput } from "./types";

type AcknowledgmentSnapshot = {
  f1: F1Result;
  f2: F2Result;
  f3: F3Result;
  f4: F4Result;
  f6: F6Result;
  f7: F7Result;
};

function normalizeQualifier(value: string | null | undefined): "qualifier" | "partial_qualifier" | "non_qualifier" {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("non")) return "non_qualifier";
  if (normalized.includes("partial") || normalized.includes("redshirt")) return "partial_qualifier";
  if (normalized.includes("full") || normalized.includes("qualifier")) return "qualifier";
  return "partial_qualifier";
}

function scoreQualifier(status: "qualifier" | "partial_qualifier" | "non_qualifier"): number {
  if (status === "qualifier") return 2;
  if (status === "partial_qualifier") return 1;
  return 0;
}

function deriveCompletionStatus(result: { fullyComplete?: boolean; applicable?: boolean }): "GREEN" | "RED" {
  if (result.applicable === false) return "GREEN";
  return result.fullyComplete ? "GREEN" : "RED";
}

function getF5BandFromInput(input: StudentInput): string | null {
  const dynamicInput = input as unknown as {
    f5?: { risk_band?: string; riskBand?: string };
    f5_risk_band?: string;
    f5RiskBand?: string;
  };
  return (
    dynamicInput.f5?.risk_band ??
    dynamicInput.f5?.riskBand ??
    dynamicInput.f5_risk_band ??
    dynamicInput.f5RiskBand ??
    null
  );
}

function hasAgDualFlag(f1: F1Result): boolean {
  return f1.creditRecoveryCandidates.some((candidate) => candidate.gradeReceived === "D");
}

function hasAnyEscalatedRedSignal(results: Array<unknown>): { hasMatch: boolean; reason: string | null } {
  for (const item of results) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (row.risk_band === "RED" && row.escalation_required === true) {
      return { hasMatch: true, reason: (row.escalation_reason as string | null) ?? "risk_red_escalated" };
    }
  }
  return { hasMatch: false, reason: null };
}

function hasConditionsDegraded(previous: AcknowledgmentSnapshot, current: AcknowledgmentSnapshot): boolean {
  const prevF4 = normalizeQualifier(previous.f4.qualifierStatus);
  const currentF4 = normalizeQualifier(current.f4.qualifierStatus);
  const prevF7 = normalizeQualifier(previous.f7.qualifierStatus);
  const currentF7 = normalizeQualifier(current.f7.qualifierStatus);

  return (
    current.f1.completionPct < previous.f1.completionPct ||
    current.f3.totalCompleted < previous.f3.totalCompleted ||
    current.f6.totalCompleted < previous.f6.totalCompleted ||
    current.f4.coreGpaWeighted < previous.f4.coreGpaWeighted ||
    current.f7.coreGpaWeighted < previous.f7.coreGpaWeighted ||
    scoreQualifier(currentF4) < scoreQualifier(prevF4) ||
    scoreQualifier(currentF7) < scoreQualifier(prevF7)
  );
}

function computeIsOnTrack(
  f5RiskBand: string | null,
  f4: F4Result,
  f1: F1Result
): boolean | null {
  const qualifierStatus = normalizeQualifier(f4.qualifierStatus);

  if (
    f5RiskBand === "GREEN" &&
    (qualifierStatus === "qualifier" || qualifierStatus === "partial_qualifier") &&
    deriveCompletionStatus(f1) !== "RED"
  ) {
    return true;
  }

  if (f5RiskBand === "RED" || qualifierStatus === "non_qualifier") {
    return false;
  }

  return null;
}

function buildResult(
  composite_band: CompositeBand,
  primary_concern: string | null,
  concern_type: string | null,
  escalation_required: boolean,
  escalation_reason: string | null,
  acknowledgment_state: "none" | "acknowledged" | "re_escalated",
  evidence_tier: "Deterministic" | "Provisional",
  is_on_track: boolean | null
): F8Result {
  return {
    composite_band,
    primary_concern,
    concern_type,
    is_on_track,
    escalation_required,
    escalation_reason,
    acknowledgment_state,
    evidence_tier,
  };
}

export async function calcEligibilitySummary(
  studentId: string,
  input: StudentInput,
  f1: F1Result,
  f2: F2Result,
  f3: F3Result,
  f4: F4Result,
  f6: F6Result,
  f7: F7Result,
  prismaClient: PrismaClient
): Promise<F8Result> {
  const evidence_tier: "Deterministic" | "Provisional" =
    f1.evidenceTier === "Deterministic" && f3.evidenceTier === "Deterministic"
      ? "Deterministic"
      : "Provisional";

  const f5RiskBand = getF5BandFromInput(input);
  const is_on_track = computeIsOnTrack(f5RiskBand, f4, f1);

  // Rule 1
  const escalatedSignal = hasAnyEscalatedRedSignal([f1, f2, f3, f4, f6, f7]);
  if (escalatedSignal.hasMatch) {
    return buildResult(
      "ESCALATED",
      "risk_red_escalated",
      "escalation",
      true,
      escalatedSignal.reason,
      "none",
      evidence_tier,
      is_on_track
    );
  }

  // Rule 2
  if (f5RiskBand === "RED") {
    return buildResult(
      "RED",
      "f5_lock_in",
      "lock_window_closed",
      true,
      "f5_lock_in",
      "none",
      evidence_tier,
      is_on_track
    );
  }

  // Rule 3
  const f4Status = normalizeQualifier(f4.qualifierStatus);
  const f7Status = normalizeQualifier((f7 as unknown as { qualifierStatus: string }).qualifierStatus);
  if (f4Status === "non_qualifier" || f7Status === "non_qualifier") {
    return buildResult(
      "RED",
      "ncaa_gpa_non_qualifier",
      "academic_eligibility",
      true,
      "ncaa_gpa_non_qualifier",
      "none",
      evidence_tier,
      is_on_track
    );
  }

  // Rule 4
  const f1Completion = deriveCompletionStatus(f1);
  const f3Completion = deriveCompletionStatus(f3);
  const f6Completion = deriveCompletionStatus(f6);
  const noFrameworkRed = f1Completion !== "RED" && f3Completion !== "RED" && f6Completion !== "RED";
  if (hasAgDualFlag(f1) && noFrameworkRed) {
    return buildResult(
      "YELLOW",
      "a_g_gpa",
      "academic_fallback_path_closing",
      false,
      null,
      "none",
      evidence_tier,
      is_on_track
    );
  }

  // Rule 5
  if (f1Completion === "RED" && f3Completion !== "RED" && f6Completion !== "RED") {
    return buildResult(
      "YELLOW",
      "a_g_completion",
      "academic_fallback_path_closing",
      false,
      null,
      "none",
      evidence_tier,
      is_on_track
    );
  }

  // Rule 6
  const divisionIncludesD1 = input.targetDivision === "DI" || input.targetDivision === "DI_or_DII_undecided";
  const d1Closed = f3Completion === "RED";
  if (divisionIncludesD1 && d1Closed) {
    const latestAcknowledgment = await prismaClient.compositeBandAcknowledgment.findFirst({
      where: { student_id: studentId },
      orderBy: { acknowledged_at: "desc" },
    });

    if (!latestAcknowledgment) {
      return buildResult(
        "RED",
        "d1_closure",
        "division_pathway_closed",
        true,
        "d1_closure",
        "none",
        evidence_tier,
        is_on_track
      );
    }

    const snapshot = latestAcknowledgment.conditions_snapshot as AcknowledgmentSnapshot | null;
    const currentSnapshot: AcknowledgmentSnapshot = { f1, f2, f3, f4, f6, f7 };
    const degraded = snapshot ? hasConditionsDegraded(snapshot, currentSnapshot) : true;

    if (degraded) {
      return buildResult(
        "RED",
        "d1_closure",
        "division_pathway_closed",
        true,
        "d1_closure",
        "re_escalated",
        evidence_tier,
        is_on_track
      );
    }

    return buildResult(
      "YELLOW",
      "d1_closure",
      "division_pathway_closed",
      false,
      null,
      "acknowledged",
      evidence_tier,
      is_on_track
    );
  }

  // Rule 7
  return buildResult(
    "GREEN",
    null,
    null,
    false,
    null,
    "none",
    evidence_tier,
    is_on_track
  );
}

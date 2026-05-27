"use client";
import * as React from "react";
import Link from "next/link";
import type { F5Result } from "@/lib/calculations/f5";
import type { F8Result, F12Result } from "@/lib/calculations/types";
import IdentityHeader from "@/components/ttg/IdentityHeader";
import ProvisionalAlert from "@/components/ttg/ProvisionalAlert";
import TenSevenPanel from "@/components/ttg/TenSevenPanel";
import DualFlagAlert from "@/components/ttg/DualFlagAlert";
import RecommendedCourses from "@/components/ttg/RecommendedCourses";
import EvidenceFootnote from "@/components/ttg/EvidenceFootnote";
import DerivationModal from "@/components/ttg/DerivationModal";
import HolisticHealthStrip from "@/components/ttg/HolisticHealthStrip";
import MentalHealthAlert from "@/components/ttg/MentalHealthAlert";
import FallbackPathwayPanel from "@/components/ttg/FallbackPathwayPanel";
import NcaaEligibilityCenterStatus from "@/components/ttg/NcaaEligibilityCenterStatus";
import NcaaApprovedCoursesPanel from "@/components/ttg/NcaaApprovedCoursesPanel";
import EligibilityPanels from "@/components/ttg/EligibilityPanels";
import type { HolisticStudentRisk } from "@/lib/calculations/holistic-rollup";
import { ESCALATION_LABELS } from "@/lib/calculations/escalation-labels";
import { INTERVENTION_LABELS } from "@/lib/calculations/intervention-labels";

type ProfileData = {
  studentId: string;
  firstName: string;
  lastName: string;
  sport: string;
  grade: number;
  highSchoolId: string;
  highSchoolName: string;
  targetDivision: string;
  courses: Array<{
    id: string;
    courseName: string;
    ncaaD1Category: string | null;
  }>;
  f5: Omit<F5Result, "lockInDate" | "computedAt"> & {
    lockInDate: string | null;
    computedAt: string;
  };
  holistic: HolisticStudentRisk;
  isDemoStudent: boolean;
  sessionUserId: string | null;
};

type EligibilityPayload = {
  f1: unknown;
  f2: unknown;
  f3: unknown;
  f4: unknown;
  f6: unknown;
  f7: unknown;
  f8?: F8Result;
  f12?: F12Result;
};

type DerivationField = "daysToLock" | "cores" | "emsSubset" | "riskBand";

const FIELD_TITLES: Record<DerivationField, string> = {
  daysToLock: "Days to Lock — Derivation",
  cores:      "Cores Complete — Derivation",
  emsSubset:  "Eng / Math / Sci Subset — Derivation",
  riskBand:   "Risk Band — Derivation",
};

export default function StudentProfileClient({ data }: { data: ProfileData }) {
  const { f5 } = data;
  const [field, setField] = React.useState<DerivationField | null>(null);
  const [eligibility, setEligibility] = React.useState<EligibilityPayload | null>(null);
  const [ackLoading, setAckLoading] = React.useState(false);
  const [ackError, setAckError] = React.useState<string | null>(null);

  const loadEligibility = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/students/${data.studentId}/eligibility`, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as EligibilityPayload;
      setEligibility(payload);
    } catch {
      // no-op; profile remains usable with fallback state
    }
  }, [data.studentId]);

  React.useEffect(() => {
    loadEligibility();
  }, [loadEligibility]);

  const fallbackBandFromHolistic =
    data.holistic.overallRisk === "CRITICAL"
      ? "RED"
      : data.holistic.overallRisk === "AT_RISK"
        ? "YELLOW"
        : "GREEN";

  const displayRiskBand =
    !data.isDemoStudent && eligibility?.f8?.composite_band
      ? eligibility.f8.composite_band
      : fallbackBandFromHolistic;

  const escalationState = eligibility?.f8;
  const masterBriefing = eligibility?.f12;
  const showEscalationOverlay =
    escalationState?.escalation_required === true &&
    escalationState.acknowledgment_state !== "acknowledged";

  async function acknowledgeEscalation() {
    if (!eligibility) return;
    setAckError(null);
    setAckLoading(true);
    try {
      const acknowledgedAt = new Date().toISOString();
      const bandTransition = "RED→YELLOW";
      if (!data.sessionUserId) {
        throw new Error("Session missing. Please sign in again.");
      }

      const raw = `${data.studentId}${data.sessionUserId}${bandTransition}${acknowledgedAt}`;
      const encoded = new TextEncoder().encode(raw);
      const digest = await crypto.subtle.digest("SHA-256", encoded);
      const signature = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      const response = await fetch(`/api/students/${data.studentId}/acknowledge-escalation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          band_transition: bandTransition,
          cryptographic_signature: signature,
          acknowledged_at: acknowledgedAt,
          conditions_snapshot: {
            f1: eligibility.f1,
            f2: eligibility.f2,
            f3: eligibility.f3,
            f4: eligibility.f4,
            f6: eligibility.f6,
            f7: eligibility.f7,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Acknowledgment failed.");
      }

      await loadEligibility();
    } catch (error) {
      setAckError(error instanceof Error ? error.message : "Acknowledgment failed.");
    } finally {
      setAckLoading(false);
    }
  }

  const lockInDate = f5.lockInDate
    ? new Date(f5.lockInDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const provisionalReason =
    f5.lockInDateBasis === "fallback_estimate_grade9_plus_3yr"
      ? "Lock-in date estimated from grade 9 enrollment (school calendar not on file). Confirm with school registrar."
      : "One or more course classifications are over 365 days old. Re-verify with NCAA Eligibility Center.";

  const evidenceTier: "Deterministic" | "Provisional" =
    f5.evidenceTier === "Deterministic" ? "Deterministic" : "Provisional";

  const derivationBody: Record<DerivationField, string> = {
    daysToLock: f5.derivation.daysToLockExplanation,
    cores:      f5.derivation.completedCountExplanation,
    emsSubset:  f5.derivation.completedCountExplanation,
    riskBand:   f5.derivation.riskBandExplanation,
  };

  const riskBand = (f5.applicable ? f5.riskBand : "NOT_APPLICABLE") as
    | "GREEN" | "YELLOW" | "RED" | "LOCKED" | "NOT_APPLICABLE";

  return (
    <div className="relative">
      {showEscalationOverlay ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-xl rounded-lg border border-band-urgent-border bg-surface-card p-6 shadow-2xl">
            <h2 className="font-serif text-[22px] text-text-primary">Escalation review required</h2>
            <p className="mt-2 font-sans text-[13px] text-text-secondary">
              {ESCALATION_LABELS[escalationState?.escalation_reason ?? ""] ??
                "A critical eligibility condition requires advisor acknowledgment."}
            </p>
            {ackError ? (
              <p className="mt-3 font-sans text-[12px] text-band-urgent">{ackError}</p>
            ) : null}
            <button
              type="button"
              onClick={acknowledgeEscalation}
              disabled={ackLoading}
              className="mt-5 rounded bg-gold-500 px-4 py-2.5 font-sans text-[13px] font-semibold text-[#1a1f14] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {ackLoading ? "Acknowledging..." : "I acknowledge and will take action"}
            </button>
          </div>
        </div>
      ) : null}

      <div className={showEscalationOverlay ? "pointer-events-none select-none opacity-40" : ""}>
      <div className="mt-6">
        <IdentityHeader
          firstName={data.firstName}
          lastName={data.lastName}
          grade={data.grade}
          sport={data.sport}
          highSchool={data.highSchoolName}
          targetDivision={data.targetDivision}
          riskBand={displayRiskBand}
        />
      </div>

      <div className="mt-6">
        <MentalHealthAlert holistic={data.holistic} />
      </div>

      {f5.provisionalFlag && (
        <div className="mt-6">
          <ProvisionalAlert reason={provisionalReason} />
        </div>
      )}

      <div className="mt-6">
        <HolisticHealthStrip holistic={data.holistic} />
      </div>

      <div className="mt-6">
        <NcaaEligibilityCenterStatus studentId={data.studentId} />
      </div>

      <div className="mt-6" id="transcript">
        <div className="mb-3 flex justify-end gap-2">
          <Link
            href={`/students/${data.studentId}/engagement/new`}
            className="rounded border border-[color:var(--border-default)] px-3 py-1.5 font-sans text-[12px] font-semibold text-text-primary transition-colors hover:bg-surface-inner"
          >
            Add engagement observation
          </Link>
          <Link
            href={`/students/${data.studentId}/transcript/new`}
            className="rounded border border-[color:var(--border-default)] px-3 py-1.5 font-sans text-[12px] font-semibold text-text-primary transition-colors hover:bg-surface-inner"
          >
            Add transcript course
          </Link>
        </div>
        <NcaaApprovedCoursesPanel
          highSchoolId={data.highSchoolId}
          highSchoolName={data.highSchoolName}
          studentCourses={data.courses}
        />
      </div>

      {masterBriefing ? (
        <div className="mt-6 rounded-lg border border-[color:var(--border-default)] bg-surface-card p-4">
          <details open>
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-[20px] text-text-primary">Master briefing</p>
                  <p className="font-sans text-[12px] text-text-secondary">
                    {data.firstName} {data.lastName} · {masterBriefing.composite_band}
                  </p>
                </div>
                {masterBriefing.weeks_to_critical_action === null ? (
                  <span className="rounded-full border border-band-positive-border bg-band-positive/20 px-3 py-1 font-sans text-[12px] font-semibold text-band-positive">
                    No critical action window
                  </span>
                ) : (
                  <span
                    className={`rounded-full border px-3 py-1 font-sans text-[12px] font-semibold ${
                      masterBriefing.weeks_to_critical_action <= 1
                        ? "border-band-urgent-border bg-band-urgent/20 text-band-urgent"
                        : "border-band-watch-border bg-band-watch/20 text-band-watch"
                    }`}
                  >
                    Action required in {masterBriefing.weeks_to_critical_action} week
                    {masterBriefing.weeks_to_critical_action === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </summary>

            <div className="mt-4 space-y-4">
              <div>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                  Intervention priorities
                </p>
                <ol className="mt-2 space-y-1">
                  {masterBriefing.intervention_codes.map((code) => (
                    <li
                      key={code}
                      className={`font-sans text-[13px] ${
                        code === "NO_ACTION_REQUIRED" ? "text-band-positive" : "text-text-primary"
                      }`}
                    >
                      {INTERVENTION_LABELS[code]}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="overflow-x-auto rounded border border-[color:var(--border-default)]">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead className="bg-surface-inner">
                    <tr>
                      <th className="px-3 py-2 text-left font-sans text-[11px] uppercase tracking-[0.06em] text-text-tertiary">Layer</th>
                      <th className="px-3 py-2 text-left font-sans text-[11px] uppercase tracking-[0.06em] text-text-tertiary">Status</th>
                      <th className="px-3 py-2 text-left font-sans text-[11px] uppercase tracking-[0.06em] text-text-tertiary">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[color:var(--border-default)]">
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">Eligibility</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">{masterBriefing.layer_summary.eligibility.band}</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-secondary">{masterBriefing.layer_summary.eligibility.flag ?? "—"}</td>
                    </tr>
                    <tr className="border-t border-[color:var(--border-default)]">
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">GPA</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">{masterBriefing.layer_summary.gpa.band}</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-secondary">{masterBriefing.layer_summary.gpa.flag ?? "—"}</td>
                    </tr>
                    <tr className="border-t border-[color:var(--border-default)]">
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">Trajectory</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">
                        {masterBriefing.layer_summary.trajectory.direction ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-secondary">
                        {masterBriefing.layer_summary.trajectory.regression ? "regression_flag" : "—"}
                      </td>
                    </tr>
                    <tr className="border-t border-[color:var(--border-default)]">
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">AIMS</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">
                        {masterBriefing.layer_summary.aims.risk_band}
                      </td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-secondary">
                        {masterBriefing.layer_summary.aims.flags[0] ?? "—"}
                      </td>
                    </tr>
                    <tr className="border-t border-[color:var(--border-default)]">
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">Engagement</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">
                        {masterBriefing.layer_summary.engagement.trend}
                      </td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-secondary">
                        {masterBriefing.layer_summary.engagement.withdrawal
                          ? "withdrawal_flag"
                          : masterBriefing.layer_summary.engagement.low
                            ? "low_engagement_flag"
                            : "—"}
                      </td>
                    </tr>
                    <tr className="border-t border-[color:var(--border-default)]">
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">Composite</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-primary">{masterBriefing.layer_summary.composite.band}</td>
                      <td className="px-3 py-2 font-sans text-[13px] text-text-secondary">
                        {masterBriefing.layer_summary.composite.escalation ? "escalation_required" : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--border-default)] pt-3">
                <span className="rounded-full border border-[color:var(--border-default)] px-2.5 py-1 font-sans text-[11px] font-semibold text-text-secondary">
                  Evidence: {masterBriefing.overall_evidence_tier}
                </span>
                <p className="font-sans text-[11px] text-text-tertiary">
                  {masterBriefing.briefing_version} · {new Date(masterBriefing.generated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </details>
        </div>
      ) : null}

      {f5.applicable && (
        <div className="mt-6">
          <TenSevenPanel
            riskBand={f5.riskBand as "GREEN" | "YELLOW" | "RED" | "LOCKED"}
            riskBandExplanation={f5.derivation.riskBandExplanation}
            daysToLock={f5.pastLock ? "Past lock" : (f5.daysToLock ?? 0)}
            lockInDate={lockInDate}
            cores={{
              completed: f5.completedTotal,
              required: f5.requiredTotal,
              missing: f5.missingTotal,
            }}
            emsSubset={{
              completed: f5.completedEngMathSci,
              required: f5.requiredEngMathSci,
              missing: f5.missingEngMathSci,
            }}
            provisionalFlag={f5.provisionalFlag}
            onOpenDerivation={(f) => setField(f)}
          />
        </div>
      )}

      {f5.agFailureDualFlags.length > 0 && (
        <div className="mt-6">
          <DualFlagAlert flags={f5.agFailureDualFlags} />
        </div>
      )}

      {f5.applicable && (
        <div className="mt-6">
          {f5.fallbackPathway ? (
            <FallbackPathwayPanel pathway={f5.fallbackPathway} />
          ) : (
            <RecommendedCourses
              courses={f5.recommendedCoursesNextTerm}
              riskBand={riskBand}
            />
          )}
        </div>
      )}

      <div className="mt-6">
        <EvidenceFootnote
          evidenceTier={evidenceTier}
          text="All calculations trace to NCAA Bylaw 14.3 or Manteca Unified School District published calendar assumptions."
          sourceUrl={f5.derivation.sourceUrl}
          sourceLabel="NCAA Bylaw 14.3"
        />
      </div>

      <DerivationModal
        open={field !== null}
        onClose={() => setField(null)}
        title={field ? FIELD_TITLES[field] : ""}
        body={field ? derivationBody[field] : ""}
        evidenceTier={evidenceTier}
        sourceUrl={f5.derivation.sourceUrl}
        sourceLabel="NCAA Bylaw 14.3"
      />
      </div>
    </div>
  );
}

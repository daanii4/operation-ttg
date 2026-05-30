"use client";

import * as React from "react";
import { EvidenceTierChip } from "@/components/ui/qn";
import { InterventionCodes } from "@/app/dashboard/briefings/_components/InterventionCodes";
import { LayerSummary } from "@/app/dashboard/briefings/_components/LayerSummary";
import { selectInterventionRows } from "@/app/dashboard/briefings/_components/use-briefing-data";
import { escalationLabel } from "@/lib/calculations/escalation-labels";
import type { ProfileEligibilityPayload } from "../profile-types";

export function ProfileOverviewTab({
  studentId,
  eligibility,
  sessionUserId,
  onEligibilityRefresh,
}: {
  studentId: string;
  eligibility: ProfileEligibilityPayload | null;
  sessionUserId: string;
  onEligibilityRefresh: () => void;
}) {
  const [ackLoading, setAckLoading] = React.useState(false);
  const [ackError, setAckError] = React.useState<string | null>(null);

  if (!eligibility?.f12) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <EvidenceTierChip tier="Insufficient" />
        <p className="max-w-md font-sans text-[13px] text-[var(--text-tertiary)]">
          Eligibility data unavailable — check back after sessions are logged.
        </p>
      </div>
    );
  }

  const f12 = eligibility.f12;
  const f8 = eligibility.f8;
  const rows = selectInterventionRows(f12);
  const needsAction = rows.some((r) => r.code !== "NO_ACTION_REQUIRED");
  const showEscalation =
    f8?.escalation_required === true && f8.acknowledgment_state !== "acknowledged";

  async function acknowledgeEscalation() {
    if (!eligibility) return;
    setAckError(null);
    setAckLoading(true);
    try {
      const acknowledgedAt = new Date().toISOString();
      const bandTransition = "RED→YELLOW";
      const raw = `${studentId}${sessionUserId}${bandTransition}${acknowledgedAt}`;
      const encoded = new TextEncoder().encode(raw);
      const digest = await crypto.subtle.digest("SHA-256", encoded);
      const signature = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      const response = await fetch(`/api/students/${studentId}/acknowledge-escalation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          band_transition: bandTransition,
          cryptographic_signature: signature,
          acknowledged_at: acknowledgedAt,
          conditions_snapshot: {
            f1: eligibility.f1,
            f3: eligibility.f3,
            f4: eligibility.f4,
            f6: eligibility.f6,
            f7: eligibility.f7,
          },
        }),
      });
      if (!response.ok) throw new Error("Acknowledgment failed.");
      onEligibilityRefresh();
    } catch (err) {
      setAckError(err instanceof Error ? err.message : "Acknowledgment failed.");
    } finally {
      setAckLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
      {showEscalation ? (
        <div
          className="border-b border-[var(--border-default)] px-5 py-4"
          style={{ background: "var(--color-red-tint)" }}
        >
          <h3 className="font-serif text-[18px] text-[var(--text-primary)]">
            Escalation review required
          </h3>
          <p className="mt-1 font-sans text-[13px] text-[var(--text-secondary)]">
            {escalationLabel(f8?.escalation_reason ?? null)}
          </p>
          {ackError ? (
            <p className="mt-2 font-sans text-[12px] text-[var(--color-red)]">{ackError}</p>
          ) : null}
          <button
            type="button"
            onClick={acknowledgeEscalation}
            disabled={ackLoading}
            className="mt-3 rounded-md bg-[var(--gold-500)] px-4 py-2 font-sans text-[13px] font-semibold text-[#1e2b12] disabled:opacity-60"
          >
            {ackLoading ? "Acknowledging…" : "I acknowledge and will take action"}
          </button>
        </div>
      ) : null}

      <div className="border-b border-[var(--border-default)] px-5 py-4">
        <h3 className="font-serif text-[18px] text-[var(--text-primary)]">
          {needsAction ? "Required Actions" : "On Track"}
        </h3>
      </div>

      <InterventionCodes f12={f12} sectionBorder />
      <LayerSummary payload={eligibility} />
    </div>
  );
}

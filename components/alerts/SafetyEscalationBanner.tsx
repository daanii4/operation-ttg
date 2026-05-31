"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { AdvisorRole, CounselorEscalationAction } from "@prisma/client";
import type { F8Result } from "@/lib/calculations/types";
import { escalationLabel } from "@/lib/calculations/escalation-labels";
import {
  COUNSELOR_ESCALATION_ACTIONS,
  COUNSELOR_ACTION_LABELS,
} from "@/lib/briefings/counselor-escalation-action";
import { canAcknowledgeEscalation } from "@/lib/briefings/escalation-access";

export interface LatestAcknowledgment {
  id: string;
  acknowledgedAt: string;
  advisorId: string;
  advisorName: string;
  counselorAction: CounselorEscalationAction | null;
  counselorNotes: string | null;
}

export interface SafetyEscalationBannerProps {
  studentId: string;
  f8: F8Result;
  sessionUserId: string;
  teamRole: AdvisorRole;
  assignedAdvisorId: string | null;
  latestAcknowledgment: LatestAcknowledgment | null;
  conditionsSnapshot: Record<string, unknown>;
  /** Anchor target for "View acknowledgment" on student profile. */
  historyAnchorId?: string;
  onAcknowledged: () => void;
}

function resolveReason(f8: F8Result): string {
  if (f8.acknowledgment_state === "re_escalated") {
    return escalationLabel("re_escalated_after_ack");
  }
  return escalationLabel(f8.escalation_reason ?? f8.primary_concern);
}

async function computeSignature(input: {
  studentId: string;
  advisorId: string;
  bandTransition: string;
  acknowledgedAtIso: string;
}): Promise<string> {
  const raw = `${input.studentId}${input.advisorId}${input.bandTransition}${input.acknowledgedAtIso}`;
  const encoded = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function SafetyEscalationBanner({
  studentId,
  f8,
  sessionUserId,
  teamRole,
  assignedAdvisorId,
  latestAcknowledgment,
  conditionsSnapshot,
  historyAnchorId = "escalation-history",
  onAcknowledged,
}: SafetyEscalationBannerProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [action, setAction] = React.useState<CounselorEscalationAction>("ADVISOR_CONTACT_MADE");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isActive = f8.escalation_required === true;
  const isAcknowledged =
    !f8.escalation_required && f8.acknowledgment_state === "acknowledged" && latestAcknowledgment;
  const mayAcknowledge = canAcknowledgeEscalation({
    sessionUserId,
    teamRole,
    assignedAdvisorId,
  });

  const reason = resolveReason(f8);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function submitAcknowledgment() {
    const trimmed = notes.trim();
    if (!trimmed) {
      setError("Describe the action you took — this field is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const acknowledgedAt = new Date().toISOString();
      const bandTransition = "SAFETY_ESCALATION_ACK";
      const signature = await computeSignature({
        studentId,
        advisorId: sessionUserId,
        bandTransition,
        acknowledgedAtIso: acknowledgedAt,
      });

      const response = await fetch(`/api/students/${studentId}/acknowledge-escalation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          band_transition: bandTransition,
          cryptographic_signature: signature,
          acknowledged_at: acknowledgedAt,
          counselor_action: action,
          counselor_notes: trimmed,
          conditions_snapshot: {
            ...conditionsSnapshot,
            escalation_reason: f8.escalation_reason,
            primary_concern: f8.primary_concern,
          },
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Couldn't save acknowledgment — retry.");
      }

      setFormOpen(false);
      setNotes("");
      onAcknowledged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save acknowledgment — retry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isActive && !isAcknowledged) {
    return null;
  }

  if (isAcknowledged && latestAcknowledgment) {
    const ackDate = new Date(latestAcknowledgment.acknowledgedAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return (
      <div
        className="w-full px-5 py-4"
        style={{
          background: "var(--safety-fill)",
          borderBottom: "1px solid color-mix(in srgb, var(--safety-stroke) 30%, transparent)",
          transition: prefersReducedMotion ? "none" : "background var(--duration-fast) var(--ease-out)",
        }}
      >
        <div className="mx-auto flex max-w-[960px] items-start gap-3">
          <ShieldCheck size={20} aria-hidden style={{ color: "var(--safety-stroke)", flexShrink: 0 }} />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[15px] font-semibold" style={{ color: "var(--safety-stroke)" }}>
              Escalation Acknowledged
            </p>
            <p className="mt-1 font-sans text-[14px]" style={{ color: "var(--text-secondary)" }}>
              {reason}
            </p>
            <p className="mt-1 font-sans text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              {latestAcknowledgment.advisorName} · {ackDate}
              {latestAcknowledgment.counselorAction
                ? ` · ${COUNSELOR_ACTION_LABELS[latestAcknowledgment.counselorAction]}`
                : ""}
            </p>
            {latestAcknowledgment.counselorNotes ? (
              <p className="mt-1 font-sans text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {latestAcknowledgment.counselorNotes}
              </p>
            ) : null}
            <Link
              href={`/students/${studentId}#${historyAnchorId}`}
              className="mt-2 inline-block font-sans text-[13px] font-medium underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: "var(--safety-stroke)" }}
            >
              View acknowledgment
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full px-5 py-4"
      style={{
        background: "var(--safety-stroke)",
        borderBottom: "2px solid #7f1616",
      }}
    >
      <div className="mx-auto max-w-[960px]">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} aria-hidden className="shrink-0 text-white" />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[15px] font-semibold text-white">
              Escalation Required — Refer to Licensed Clinician
            </p>
            <p className="mt-1 font-sans text-[14px] text-white/90">{reason}</p>

            {!formOpen ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  disabled={!mayAcknowledge || submitting}
                  title={
                    mayAcknowledge
                      ? undefined
                      : "Only the assigned advisor or program owner can acknowledge this escalation."
                  }
                  className="min-h-[40px] rounded px-4 py-2 font-sans text-[14px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    background: "white",
                    color: "var(--safety-stroke)",
                  }}
                  aria-busy={submitting}
                >
                  {mayAcknowledge
                    ? "Acknowledge & Document Action"
                    : "Assigned advisor must acknowledge"}
                </button>
              </div>
            ) : (
              <div className="mt-3 rounded bg-white/10 p-3">
                <label className="block font-sans text-[12px] font-medium text-white" htmlFor="counselor-action">
                  Action taken
                </label>
                <select
                  id="counselor-action"
                  value={action}
                  onChange={(e) => setAction(e.target.value as CounselorEscalationAction)}
                  className="mt-1 w-full rounded border border-white/30 bg-white px-2 py-2 font-sans text-[13px] text-[var(--text-primary)]"
                  disabled={submitting}
                >
                  {COUNSELOR_ESCALATION_ACTIONS.map((code) => (
                    <option key={code} value={code}>
                      {COUNSELOR_ACTION_LABELS[code]}
                    </option>
                  ))}
                </select>
                <label className="mt-2 block font-sans text-[12px] font-medium text-white" htmlFor="counselor-notes">
                  What did you do? (required)
                </label>
                <textarea
                  id="counselor-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={submitting}
                  className="mt-1 w-full resize-y rounded border border-white/30 bg-white px-2 py-2 font-sans text-[13px] text-[var(--text-primary)]"
                  placeholder="e.g. Referred to district clinician; parent contacted 5/30."
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitAcknowledgment}
                    disabled={submitting}
                    aria-busy={submitting}
                    className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded bg-white px-4 py-2 font-sans text-[14px] font-semibold disabled:opacity-70"
                    style={{ color: "var(--safety-stroke)" }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden />
                        Documenting…
                      </>
                    ) : (
                      "Save acknowledgment"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormOpen(false);
                      setError(null);
                    }}
                    disabled={submitting}
                    className="min-h-[40px] rounded px-3 py-2 font-sans text-[13px] text-white underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error ? (
              <p role="alert" className="mt-2 font-sans text-[13px] font-medium text-white">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SafetyEscalationBanner;

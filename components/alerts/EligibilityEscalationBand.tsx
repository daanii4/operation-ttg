"use client";

import { GitBranch } from "lucide-react";

export interface EligibilityEscalationBandProps {
  weeksToCriticalAction: number | null;
}

/**
 * Academic-urgency strip for composite ESCALATED without clinical safety escalation.
 * Visually distinct from SafetyEscalationBanner — violet, passive, role="status".
 */
export function EligibilityEscalationBand({ weeksToCriticalAction }: EligibilityEscalationBandProps) {
  const immediate = weeksToCriticalAction === 0;

  return (
    <div
      role="status"
      className="flex w-full flex-wrap items-center gap-2 px-4 py-2.5"
      style={{
        background: "var(--status-escalated-tint)",
        borderBottom: "1px solid var(--status-escalated)",
      }}
    >
      <GitBranch size={16} aria-hidden style={{ color: "var(--status-escalated)" }} />
      <span
        className="font-sans font-semibold"
        style={{ fontSize: 12, color: "var(--status-escalated)" }}
      >
        Highest urgency — eligibility pathway action needed
      </span>
      {immediate ? (
        <span className="font-sans font-semibold" style={{ fontSize: 12, color: "var(--status-urgent)" }}>
          · Immediate action required
        </span>
      ) : null}
    </div>
  );
}

export default EligibilityEscalationBand;

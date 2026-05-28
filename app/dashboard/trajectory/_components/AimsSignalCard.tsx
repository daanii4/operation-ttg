"use client";

/**
 * Sprint 6 / A4-3 — AIMS Signal card.
 *
 * Risk band pill (Low / Moderate / High / Insufficient) with the same color
 * mapping advisors see in the briefing card. The within-subject delta is the
 * primary number — rendered large + monospace, with a directional arrow that
 * is *inverted* relative to GPA: an arrow up means the situation is getting
 * worse (more identity threat / exclusivity / negative affect).
 */

import * as React from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, MinusCircle } from "lucide-react";
import {
  aimsFlagLabel,
  aimsRiskLabel,
  evidenceTierLabel,
} from "@/lib/calculations/display-labels";
import type { AimsRiskBand, F10Result } from "@/lib/calculations/types";
import {
  workspaceSectionShell,
  type WorkspaceSectionVariant,
} from "@/lib/ui/workspace-section";

const RISK_TONE: Record<AimsRiskBand, { fg: string; bg: string; border: string }> = {
  Low: {
    fg: "var(--color-green)",
    bg: "var(--color-green-tint)",
    border: "var(--color-green)",
  },
  Moderate: {
    fg: "var(--color-yellow)",
    bg: "var(--color-yellow-tint)",
    border: "var(--color-yellow)",
  },
  High: {
    fg: "var(--color-red)",
    bg: "var(--color-red-tint)",
    border: "var(--color-red)",
  },
  Insufficient: {
    fg: "var(--text-tertiary)",
    bg: "var(--surface-inner)",
    border: "var(--border-default)",
  },
};

export interface AimsSignalCardProps {
  f10: F10Result | null | undefined;
  variant?: WorkspaceSectionVariant;
}

export function AimsSignalCard({ f10, variant = "card" }: AimsSignalCardProps) {
  const riskBand = f10?.risk_band ?? "Insufficient";
  const tone = RISK_TONE[riskBand];
  const delta = f10?.within_subject_delta_pct ?? null;
  const insufficient =
    !f10 || f10.evidence_tier === "Insufficient" || riskBand === "Insufficient";

  return (
    <section
      aria-labelledby="aims-signal-heading"
      style={workspaceSectionShell(variant)}
    >
      <header className="flex items-baseline justify-between">
        <h3
          id="aims-signal-heading"
          className="font-serif text-[18px] font-normal leading-snug text-[var(--text-primary)]"
        >
          AIMS Signal
        </h3>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          F10 · within-subject delta
        </span>
      </header>

      {f10?.version_mismatch ? (
        <div
          role="status"
          className="mt-3 flex items-start gap-2"
          style={{
            padding: "10px 12px",
            background: "var(--color-yellow-tint)",
            border: "1px solid var(--color-yellow)",
            borderRadius: 6,
          }}
        >
          <AlertTriangle
            size={16}
            aria-hidden
            style={{ color: "var(--color-yellow)", flexShrink: 0, marginTop: 1 }}
          />
          <p style={{ fontSize: 12, color: "#92400E", lineHeight: "16px" }}>
            Assessment versions differ — results excluded
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full"
          style={{
            padding: "6px 12px",
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            color: tone.fg,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {aimsRiskLabel(riskBand)}
        </span>
        <DeltaReadout delta={delta} insufficient={insufficient} />
      </div>

      {!insufficient && f10?.cross_layer_flags?.length ? (
        <ul role="list" className="mt-4 flex flex-wrap gap-2">
          {f10.cross_layer_flags.map((flag) => (
            <li
              key={flag}
              className="inline-flex items-center gap-1.5 rounded-full"
              style={{
                padding: "4px 10px",
                background: "var(--color-yellow-tint)",
                color: "#92400E",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <AlertTriangle size={12} aria-hidden style={{ color: "var(--color-yellow)" }} />
              {aimsFlagLabel(flag)}
            </li>
          ))}
        </ul>
      ) : null}

      {f10?.insufficient_reason ? (
        <p
          className="mt-3"
          style={{ fontSize: 12, color: "var(--text-tertiary)" }}
        >
          {f10.insufficient_reason}
        </p>
      ) : null}

      <p
        className="mt-3"
        style={{ fontSize: 11, color: "var(--text-tertiary)" }}
      >
        {f10 ? evidenceTierLabel(f10.evidence_tier) : "—"}
      </p>
    </section>
  );
}

function DeltaReadout({
  delta,
  insufficient,
}: {
  delta: number | null;
  insufficient: boolean;
}) {
  if (insufficient || delta == null) {
    return (
      <span
        className="inline-flex items-center gap-2"
        style={{ fontSize: 22, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}
      >
        <MinusCircle size={20} aria-hidden />
        —
      </span>
    );
  }
  // For AIMS, "up" is bad (identity threat increasing). Flip the arrow logic
  // relative to GPA so the visual reads correctly.
  const Arrow = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : MinusCircle;
  const color =
    delta > 0
      ? "var(--color-red)"
      : delta < 0
        ? "var(--color-green)"
        : "var(--text-tertiary)";

  return (
    <span
      className="inline-flex items-baseline gap-2"
      style={{
        fontSize: 22,
        lineHeight: "28px",
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        color,
      }}
    >
      <Arrow size={20} aria-hidden style={{ color }} />
      {(delta * 100).toFixed(1)}%
    </span>
  );
}

export default AimsSignalCard;

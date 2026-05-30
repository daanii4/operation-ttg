/**
 * Eligibility band badge — color + icon + RISK_VOCABULARY label (never color names).
 */

import * as React from "react";
import { RISK_VOCABULARY, type CompositeRiskBand, type RiskBand } from "@/components/ttg/risk-vocabulary";

/** Holistic Briefings band includes ESCALATED; roster Status uses RiskBand. */
export type Band = RiskBand | "ESCALATED";

const STATUS_STYLES: Record<CompositeRiskBand, { border: string; background: string; text: string }> = {
  GREEN: {
    border: "var(--color-green)",
    background: "var(--color-green-tint)",
    text: "#15803d",
  },
  YELLOW: {
    border: "var(--color-yellow)",
    background: "var(--color-yellow-tint)",
    text: "#b45309",
  },
  RED: {
    border: "var(--color-red)",
    background: "var(--color-red-tint)",
    text: "#b91c1c",
  },
  LOCKED: {
    border: "var(--color-escalated)",
    background: "var(--color-escalated-tint)",
    text: "#6d28d9",
  },
  ESCALATED: {
    border: "var(--color-escalated)",
    background: "var(--color-escalated-tint)",
    text: "#6d28d9",
  },
};

export interface BandBadgeProps {
  band?: Band | null;
  labelOverride?: string;
  className?: string;
  loading?: boolean;
}

export function BandBadge({ band, labelOverride, className, loading = false }: BandBadgeProps) {
  if (loading) {
    return (
      <span
        aria-hidden
        className={["skeleton inline-block h-[22px] w-[120px] rounded-full", className]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }

  if (!band) {
    return (
      <span
        className={[
          "inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-[11px] text-text-tertiary",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ borderColor: "var(--border-default)", background: "var(--surface-inner)" }}
      >
        —
      </span>
    );
  }

  const vocab = RISK_VOCABULARY[band];
  const tone = STATUS_STYLES[band];
  const Icon = vocab.icon;
  const label = labelOverride ?? vocab.label;

  return (
    <span
      className={[
        "relative inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5",
        "font-sans text-[11px] font-semibold leading-tight",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        background: tone.background,
        borderColor: tone.border,
        color: tone.text,
      }}
      role="status"
      aria-label={label}
    >
      {band === "ESCALATED" ? (
        <span className="relative inline-flex h-1.5 w-1.5 shrink-0" aria-hidden>
          <span
            className="qn-escalated-ping absolute inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: tone.text }}
          />
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: tone.text }}
          />
        </span>
      ) : (
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden style={{ color: tone.text }} />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

export default BandBadge;

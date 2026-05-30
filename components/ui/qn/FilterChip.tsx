"use client";

import * as React from "react";
import { RISK_VOCABULARY, type RiskBand } from "@/components/ttg/risk-vocabulary";

const TONE_BY_BAND: Record<
  RiskBand,
  { color: string; tint: string; text: string }
> = {
  GREEN: { color: "var(--color-green)", tint: "var(--color-green-tint)", text: "#15803d" },
  YELLOW: { color: "var(--color-yellow)", tint: "var(--color-yellow-tint)", text: "#b45309" },
  RED: { color: "var(--color-red)", tint: "var(--color-red-tint)", text: "#b91c1c" },
  LOCKED: {
    color: "var(--color-escalated)",
    tint: "var(--color-escalated-tint)",
    text: "#6d28d9",
  },
};

export interface FilterChipProps {
  band: RiskBand;
  active: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
  touch?: boolean;
}

export function FilterChip({
  band,
  active,
  onToggle,
  label,
  disabled = false,
  touch,
}: FilterChipProps) {
  const tone = TONE_BY_BAND[band];
  const displayLabel = label ?? RISK_VOCABULARY[band].label;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "inline-flex items-center rounded-full px-3 py-1 font-sans text-[12px] leading-4 transition-colors",
        "duration-[var(--duration-instant)] ease-[var(--ease-out)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]",
        disabled ? "cursor-not-allowed opacity-60" : "",
        active
          ? ""
          : disabled
            ? ""
            : "bg-surface-inner text-text-secondary hover:bg-olive-100 hover:text-text-primary",
      ].join(" ")}
      style={{
        minHeight: touch ? 44 : 32,
        ...(active
          ? {
              background: tone.tint,
              color: tone.text,
              border: `1px solid ${tone.color}`,
            }
          : {
              background: "var(--surface-inner)",
              color: "var(--text-secondary)",
              border: "1px solid transparent",
            }),
      }}
    >
      {displayLabel}
    </button>
  );
}

export interface UtilityFilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function UtilityFilterChip({
  label,
  active,
  onToggle,
  disabled = false,
}: UtilityFilterChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "inline-flex items-center rounded-full px-3 py-1 font-sans text-[12px] leading-4 transition-colors",
        "duration-[var(--duration-instant)] ease-[var(--ease-out)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]",
        disabled ? "cursor-not-allowed opacity-60" : "",
        active
          ? "bg-olive-600 text-white"
          : disabled
            ? "bg-surface-inner text-text-secondary"
            : "bg-surface-inner text-text-secondary hover:bg-olive-100 hover:text-text-primary",
      ].join(" ")}
      style={{ minHeight: 32 }}
    >
      {label}
    </button>
  );
}

export default FilterChip;

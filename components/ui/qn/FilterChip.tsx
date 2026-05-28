/**
 * QuasarNova v1 — §1.6 FilterChip
 *
 * Multi-select chip used in the Roster band filter. The active visual is
 * driven by the band itself — so toggling GREEN gives a green ring, YELLOW
 * gives an amber ring, etc. This keeps the filter affordance lined up with
 * the table cells the user is filtering against.
 */

"use client";

import * as React from "react";
import type { Band } from "./BandBadge";

const TONE_BY_BAND: Record<
  Band,
  { color: string; tint: string }
> = {
  GREEN: { color: "var(--color-green)", tint: "var(--color-green-tint)" },
  YELLOW: { color: "var(--color-yellow)", tint: "var(--color-yellow-tint)" },
  RED: { color: "var(--color-red)", tint: "var(--color-red-tint)" },
  ESCALATED: {
    color: "var(--color-escalated)",
    tint: "var(--color-escalated-tint)",
  },
};

export interface FilterChipProps {
  band: Band;
  active: boolean;
  onToggle: () => void;
  /** Labels default to the band token (GREEN/YELLOW/...) but can be overridden. */
  label?: string;
  /** Touch-targeted variant for mobile (min-height 36 instead of 32). */
  touch?: boolean;
}

export function FilterChip({
  band,
  active,
  onToggle,
  label,
  touch,
}: FilterChipProps) {
  const tone = TONE_BY_BAND[band];

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onToggle}
      className={[
        "inline-flex items-center gap-2 rounded-full border bg-white",
        "text-[12px] leading-4 transition-colors duration-[120ms] ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-[var(--color-focus)]",
        active
          ? ""
          : "hover:bg-[var(--color-row-alt)]",
      ].join(" ")}
      style={{
        minHeight: touch ? 36 : 32,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 6,
        paddingBottom: 6,
        background: active ? tone.tint : "white",
        borderColor: active ? tone.color : "var(--color-border)",
        color: active ? tone.color : "var(--color-text)",
      }}
    >
      <span
        aria-hidden
        className="inline-block rounded-full"
        style={{
          width: 8,
          height: 8,
          background: active ? tone.color : "var(--color-border)",
        }}
      />
      <span className="font-medium">{label ?? band}</span>
    </button>
  );
}

export default FilterChip;

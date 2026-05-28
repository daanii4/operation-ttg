/**
 * QuasarNova v1 — §1.1 BandBadge
 *
 * The four-band semantic pill: GREEN / YELLOW / RED / ESCALATED.
 *
 * • Pure presentational. No layout assumptions baked in.
 * • Color is paired with shape + animation so the badge meets WCAG 1.4.1
 *   (use of color) on its own — important because some advisors consume
 *   the dashboard via screen-share or in low-light rooms where color
 *   discrimination drops.
 *
 * For ESCALATED specifically the spec mandates a 6px filled dot before the
 * label and a `qn-escalated-ping` ring (see globals.css). The ring is the
 * non-color cue that makes escalation detectable for color-blind users.
 */

import * as React from "react";

export type Band = "GREEN" | "YELLOW" | "RED" | "ESCALATED";

type Tone = {
  border: string;
  background: string;
  text: string;
  label: string;
};

const TONES: Record<Band, Tone> = {
  GREEN: {
    border: "var(--color-green)",
    background: "var(--color-green-tint)",
    text: "var(--color-green)",
    label: "GREEN",
  },
  YELLOW: {
    border: "var(--color-yellow)",
    background: "var(--color-yellow-tint)",
    text: "var(--color-yellow)",
    label: "YELLOW",
  },
  RED: {
    border: "var(--color-red)",
    background: "var(--color-red-tint)",
    text: "var(--color-red)",
    label: "RED",
  },
  ESCALATED: {
    border: "var(--color-escalated)",
    background: "var(--color-escalated-tint)",
    text: "var(--color-escalated)",
    label: "ESCALATED",
  },
};

export interface BandBadgeProps {
  band?: Band | null;
  /** Optional override label (rare — used in tests/demos only). */
  labelOverride?: string;
  className?: string;
  /**
   * Loading skeleton. Renders a 56×18 shimmer pill matching the resting
   * footprint so layout doesn't reflow when the value arrives.
   */
  loading?: boolean;
}

export function BandBadge({
  band,
  labelOverride,
  className,
  loading = false,
}: BandBadgeProps) {
  if (loading) {
    return (
      <span
        aria-hidden
        className={["qn-skeleton inline-block h-[18px] w-14", className]
          .filter(Boolean)
          .join(" ")}
        style={{ borderRadius: 9999 }}
      />
    );
  }

  if (!band) {
    return (
      <span
        className={[
          "inline-flex items-center justify-center rounded-full border px-2",
          "text-[9px] font-semibold uppercase tracking-[0.04em]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          minHeight: 18,
          paddingTop: 3,
          paddingBottom: 3,
          background: "#F9FAFB",
          borderColor: "#E5E7EB",
          color: "#6B7280",
        }}
        aria-label="Band unknown"
      >
        —
      </span>
    );
  }

  const tone = TONES[band];

  return (
    <span
      className={[
        "relative inline-flex items-center gap-1 rounded-full border",
        "text-[9px] font-semibold uppercase tracking-[0.04em] leading-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        minHeight: 18,
        paddingTop: 3,
        paddingBottom: 3,
        paddingLeft: 8,
        paddingRight: 8,
        background: tone.background,
        borderColor: tone.border,
        color: tone.text,
      }}
      aria-label={`Band ${labelOverride ?? tone.label}`}
    >
      {band === "ESCALATED" && (
        <span
          className="relative inline-flex items-center justify-center"
          aria-hidden
          style={{ width: 6, height: 6 }}
        >
          {/* The ping ring is the non-color cue per §1.1. */}
          <span
            className="qn-escalated-ping absolute inline-flex rounded-full"
            style={{
              width: 6,
              height: 6,
              background: tone.text,
            }}
          />
          <span
            className="relative inline-flex rounded-full"
            style={{
              width: 6,
              height: 6,
              background: tone.text,
            }}
          />
        </span>
      )}
      {labelOverride ?? tone.label}
    </span>
  );
}

export default BandBadge;

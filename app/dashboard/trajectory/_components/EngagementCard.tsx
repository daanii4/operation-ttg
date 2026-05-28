"use client";

/**
 * Sprint 6 / A4-3 — Engagement card.
 *
 * window_avg renders as a horizontal gauge bar 0.0–1.0 with a three-band
 * threshold colorway (red / amber / green). Trend chip + withdrawal alert
 * + low-engagement chip layered on top.
 */

import * as React from "react";
import { AlertTriangle, MinusCircle, TrendingDown, TrendingUp } from "lucide-react";
import {
  engagementTrendLabel,
  evidenceTierLabel,
} from "@/lib/calculations/display-labels";
import type { F11Result } from "@/lib/calculations/types";

export interface EngagementCardProps {
  f11: F11Result | null | undefined;
}

function gaugeColor(value: number | null): string {
  if (value == null) return "var(--color-muted)";
  if (value < 0.4) return "var(--color-red)";
  if (value < 0.7) return "var(--color-yellow)";
  return "var(--color-green)";
}

export function EngagementCard({ f11 }: EngagementCardProps) {
  const insufficient = !f11 || f11.evidence_tier === "Insufficient";
  const avg = f11?.window_avg ?? null;
  const color = gaugeColor(avg);
  const filled = Math.max(0, Math.min(1, avg ?? 0));

  return (
    <section
      aria-labelledby="engagement-heading"
      style={{
        padding: 20,
        background: "var(--color-bg)",
        borderRadius: 8,
        border: "1px solid var(--color-border)",
      }}
    >
      <header className="flex items-baseline justify-between">
        <h3
          id="engagement-heading"
          className="text-base font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          Engagement
        </h3>
        <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
          F11 · window average
        </span>
      </header>

      <div className="mt-4">
        {/* Gauge bar */}
        <div
          aria-label={`Engagement score ${avg != null ? avg.toFixed(2) : "unavailable"} of 1.0`}
          role="meter"
          aria-valuenow={avg ?? undefined}
          aria-valuemin={0}
          aria-valuemax={1}
          style={{
            position: "relative",
            width: "100%",
            height: 12,
            borderRadius: 6,
            background: "var(--color-row-alt)",
            overflow: "hidden",
          }}
        >
          {avg != null ? (
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${filled * 100}%`,
                background: color,
                transition: "width 200ms ease-out, background 200ms ease-out",
              }}
            />
          ) : null}
          {/* Threshold ticks at 0.4 and 0.7 so advisors can read the bands. */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: "40%",
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(0,0,0,0.10)",
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: "70%",
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(0,0,0,0.10)",
            }}
          />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 22,
              fontWeight: 500,
              color: insufficient ? "var(--color-muted)" : color,
            }}
          >
            {avg != null ? avg.toFixed(2) : "—"}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
            scale 0.0 → 1.0
          </span>
        </div>
      </div>

      {f11?.withdrawal_flag ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2"
          style={{
            padding: "10px 12px",
            background: "var(--color-red-tint)",
            border: "1px solid var(--color-red)",
            borderRadius: 6,
            color: "var(--color-red)",
          }}
        >
          <AlertTriangle size={16} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, fontWeight: 600, lineHeight: "16px" }}>
            Withdrawal pattern detected — {f11.consecutive_absences} consecutive
            absences
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full"
          style={{
            padding: "4px 10px",
            background: "var(--color-row-alt)",
            color: "var(--color-text)",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <TrendIcon trend={f11?.trend ?? null} />
          Trend · {engagementTrendLabel(f11?.trend)}
        </span>

        {!f11?.withdrawal_flag && f11?.low_engagement_flag ? (
          <span
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
            Low engagement
          </span>
        ) : null}
      </div>

      {f11?.insufficient_reason ? (
        <p className="mt-3" style={{ fontSize: 12, color: "var(--color-muted)" }}>
          {f11.insufficient_reason}
        </p>
      ) : null}

      <p className="mt-3" style={{ fontSize: 11, color: "var(--color-muted)" }}>
        {f11 ? evidenceTierLabel(f11.evidence_tier) : "—"}
      </p>
    </section>
  );
}

function TrendIcon({ trend }: { trend: F11Result["trend"] | null }) {
  if (trend === "rising") {
    return <TrendingUp size={12} aria-hidden style={{ color: "var(--color-green)" }} />;
  }
  if (trend === "declining") {
    return <TrendingDown size={12} aria-hidden style={{ color: "var(--color-red)" }} />;
  }
  return <MinusCircle size={12} aria-hidden style={{ color: "var(--color-muted)" }} />;
}

export default EngagementCard;

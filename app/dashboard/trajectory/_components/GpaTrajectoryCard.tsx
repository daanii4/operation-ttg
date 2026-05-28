"use client";

/**
 * Sprint 6 / A4-3 — GPA Trajectory card.
 *
 * Recharts LineChart with two series:
 *   • actual GPA observations over time (solid line)
 *   • OLS regression line (dashed)
 *   • optional CI band rendered as a ReferenceArea between upper/lower bounds
 *
 * Below the chart: direction / regression / plateau / evidence-tier chips.
 *
 * Empty state when f9 is missing or evidence_tier === "Insufficient" — we
 * lean on the central display-labels to translate machine codes into copy.
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, CircleDashed, TrendingDown, TrendingUp } from "lucide-react";
import {
  EvidenceTierChip,
  type EvidenceTier as ChipTier,
} from "@/components/ui/qn";
import {
  trajectoryDirectionLabel,
  evidenceTierLabel,
} from "@/lib/calculations/display-labels";
import {
  tierToChipBucket,
} from "@/app/dashboard/briefings/_components/use-briefing-data";
import type { F9Result } from "@/lib/calculations/types";

export type ObservedGrade = { observed_grade: string; observed_at: string | Date };

// Recharts is heavy + DOM-bound. Defer the chart bundle so the rest of the
// page hydrates first; the parent renders a placeholder while it loads.
const Chart = dynamic(() => import("./GpaTrajectoryChart"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      style={{
        width: "100%",
        height: 240,
        background: "var(--color-row-alt)",
        borderRadius: 6,
      }}
    />
  ),
});

export interface GpaTrajectoryCardProps {
  f9: F9Result | null | undefined;
  /** Observed grade samples used to seed the chart. */
  observations: ObservedGrade[] | null;
}

const LETTER_TO_GPA: Record<string, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  F: 0.0,
};

export function GpaTrajectoryCard({ f9, observations }: GpaTrajectoryCardProps) {
  const insufficient = !f9 || f9.evidence_tier === "Insufficient";

  return (
    <section
      aria-labelledby="gpa-trajectory-heading"
      style={{
        padding: 20,
        background: "var(--color-bg)",
        borderRadius: 8,
        border: "1px solid var(--color-border)",
      }}
    >
      <header className="flex items-baseline justify-between">
        <h3
          id="gpa-trajectory-heading"
          className="text-base font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          GPA Trajectory
        </h3>
        <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
          F9 · 63d window + 30d regression
        </span>
      </header>

      <div className="mt-4">
        {insufficient ? (
          <InsufficientState
            reason={f9?.insufficient_reason ?? "Not enough recent grade data"}
          />
        ) : (
          <Chart
            slope={f9.slope}
            ci={f9.confidence_interval}
            samples={pointsFromObservations(observations)}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip
          tone={f9?.direction === "improving" ? "ok" : f9?.direction === "declining" ? "warn" : "muted"}
          icon={
            f9?.direction === "improving"
              ? TrendingUp
              : f9?.direction === "declining"
                ? TrendingDown
                : CircleDashed
          }
          label={`Direction · ${trajectoryDirectionLabel(f9?.direction)}`}
        />
        {f9?.regression_flag ? (
          <Chip tone="warn" icon={AlertTriangle} label="Regression flagged" />
        ) : null}
        {f9?.plateau_flag ? (
          <Chip tone="muted" icon={CircleDashed} label="Plateau detected" />
        ) : null}
        <EvidenceTierChip tier={f9 ? toChip(f9.evidence_tier) : "Insufficient"} />
        {f9 ? (
          <span
            style={{ fontSize: 11, color: "var(--color-muted)", marginLeft: "auto" }}
          >
            {evidenceTierLabel(f9.evidence_tier)}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function toChip(tier: F9Result["evidence_tier"]): ChipTier {
  return tierToChipBucket(tier);
}

function pointsFromObservations(
  observations: ObservedGrade[] | null
): Array<{ x: number; y: number; label: string }> {
  if (!observations) return [];
  return observations
    .map((row) => {
      const value = LETTER_TO_GPA[row.observed_grade.toUpperCase()];
      if (value == null) return null;
      const date = new Date(row.observed_at);
      if (Number.isNaN(date.getTime())) return null;
      return {
        x: date.getTime(),
        y: value,
        label: date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      };
    })
    .filter((p): p is { x: number; y: number; label: string } => p !== null)
    .sort((a, b) => a.x - b.x);
}

function InsufficientState({ reason }: { reason: string }) {
  return (
    <div
      role="status"
      style={{
        padding: 24,
        borderRadius: 6,
        background: "var(--color-row-alt)",
        textAlign: "center",
        color: "var(--color-muted)",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        Insufficient data for trajectory
      </p>
      <p style={{ marginTop: 4, fontSize: 12 }}>{reason}</p>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

function Chip({
  tone,
  icon: Icon,
  label,
}: {
  tone: "ok" | "warn" | "muted";
  icon: LucideIcon;
  label: string;
}) {
  const color =
    tone === "warn"
      ? "var(--color-red)"
      : tone === "ok"
        ? "var(--color-green)"
        : "var(--color-muted)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        padding: "4px 10px",
        background: "var(--color-row-alt)",
        color,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <Icon size={12} aria-hidden style={{ color }} />
      {label}
    </span>
  );
}

export default GpaTrajectoryCard;

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, CircleDashed, TrendingDown, TrendingUp } from "lucide-react";
import { EvidenceTierChip } from "@/components/ui/qn";
import {
  trajectoryDirectionLabel,
  evidenceTierLabel,
} from "@/lib/calculations/display-labels";
import { tierToChipBucket } from "@/app/dashboard/briefings/_components/use-briefing-data";
import type { F9Result } from "@/lib/calculations/types";

export type ObservedGrade = { observed_grade: string; observed_at: string | Date };

const Chart = dynamic(() => import("./GpaTrajectoryChart"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="h-[240px] w-full animate-pulse rounded-md bg-surface-inner"
    />
  ),
});

export interface GpaTrajectoryCardProps {
  f9: F9Result | null | undefined;
  observations: ObservedGrade[] | null;
  /** First mount draw-in only (not on athlete switch). */
  animateDrawIn?: boolean;
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

function trajectoryAriaSummary(f9: F9Result, samples: Array<{ y: number; label: string }>): string {
  const dir = trajectoryDirectionLabel(f9.direction);
  const first = samples[0]?.y.toFixed(1) ?? "—";
  const last = samples[samples.length - 1]?.y.toFixed(1) ?? "—";
  let summary = `GPA trajectory ${dir} from ${first} to ${last} over ${samples.length} observations`;
  if (f9.regression_flag) summary += ", regression flagged";
  if (f9.plateau_flag) summary += ", plateau detected";
  return summary;
}

export function GpaTrajectoryCard({
  f9,
  observations,
  animateDrawIn = false,
}: GpaTrajectoryCardProps) {
  const insufficient = !f9 || f9.evidence_tier === "Insufficient";
  const provisional = f9?.evidence_tier === "Provisional";
  const samples = pointsFromObservations(observations);
  const empty = samples.length === 0 && !insufficient;

  return (
    <section
      aria-labelledby="gpa-trajectory-heading"
      className="rounded-lg border border-[color:var(--border-default)] bg-surface-card p-5 shadow-sm"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          id="gpa-trajectory-heading"
          className="font-serif text-[18px] font-normal leading-snug text-text-primary"
        >
          GPA Trajectory
        </h3>
        <span className="font-sans text-[12px] text-text-tertiary">
          F9 · 63-day window + 30-day regression
        </span>
      </header>

      <div className="mt-4">
        {insufficient ? (
          <InsufficientState
            reason={
              f9?.insufficient_reason
                ? evidenceTierLabel(f9.insufficient_reason) !== f9.insufficient_reason
                  ? f9.insufficient_reason
                  : f9.insufficient_reason
                : "Not enough recent grade data"
            }
          />
        ) : empty ? (
          <InsufficientState reason="No grade observations in the current window yet." />
        ) : (
          <Chart
            slope={f9.slope}
            ci={f9.confidence_interval}
            direction={f9.direction}
            samples={samples}
            ariaLabel={trajectoryAriaSummary(f9, samples)}
            animateDrawIn={animateDrawIn}
          />
        )}
      </div>

      {!insufficient && !empty && f9 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DirectionChip direction={f9.direction} />
          {f9.regression_flag ? (
            <StatusChip
              label="Regression flagged"
              icon={AlertTriangle}
              className="border-[color:var(--status-urgent)]/30 bg-[var(--status-urgent-tint)] text-[color:var(--status-urgent)]"
            />
          ) : null}
          {f9.plateau_flag ? (
            <StatusChip
              label="Plateau detected"
              icon={CircleDashed}
              className="border-[color:var(--border-default)] bg-surface-inner text-text-secondary"
            />
          ) : null}
          <EvidenceTierChip tier={tierToChipBucket(f9.evidence_tier)} />
          {provisional ? (
            <span className="font-mono text-[11px] text-text-tertiary">~ provisional data</span>
          ) : null}
        </div>
      ) : insufficient ? (
        <div className="mt-4">
          <EvidenceTierChip tier="Insufficient" />
        </div>
      ) : null}
    </section>
  );
}

function DirectionChip({ direction }: { direction: F9Result["direction"] }) {
  const label = `Direction · ${trajectoryDirectionLabel(direction)}`;
  if (direction === "improving") {
    return (
      <StatusChip
        label={label}
        icon={TrendingUp}
        className="border-[color:var(--status-track)]/30 bg-[var(--status-track-tint)] text-[color:var(--status-track)]"
      />
    );
  }
  if (direction === "declining") {
    return (
      <StatusChip
        label={label}
        icon={TrendingDown}
        className="border-[color:var(--status-urgent)]/30 bg-[var(--status-urgent-tint)] text-[color:var(--status-urgent)]"
      />
    );
  }
  return (
    <StatusChip
      label={label}
      icon={CircleDashed}
      className="border-[color:var(--status-support)]/30 bg-[var(--status-support-tint)] text-[color:var(--status-support)]"
    />
  );
}

function StatusChip({
  label,
  icon: Icon,
  className,
}: {
  label: string;
  icon: typeof TrendingUp;
  className: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-[12px] font-medium",
        className,
      ].join(" ")}
    >
      <Icon size={12} aria-hidden />
      {label}
    </span>
  );
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
      className="rounded-md bg-surface-inner px-6 py-8 text-center"
    >
      <p className="font-sans text-[13px] font-semibold text-text-primary">
        Insufficient data for trajectory
      </p>
      <p className="mt-1 font-sans text-[12px] text-text-tertiary">{reason}</p>
    </div>
  );
}

export default GpaTrajectoryCard;

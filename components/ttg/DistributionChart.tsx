"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import type { LockBucket } from "@/app/api/cohort/route";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";

const Chart = dynamic(() => import("./DistributionChartInner"), {
  ssr: false,
  loading: () => <div className="skeleton h-[220px] w-full rounded" />,
});

const LEGEND: Array<{ key: "GREEN" | "YELLOW" | "RED" | "LOCKED"; color: string }> = [
  { key: "GREEN", color: "var(--status-track)" },
  { key: "YELLOW", color: "var(--status-support)" },
  { key: "RED", color: "var(--status-urgent)" },
  { key: "LOCKED", color: "var(--status-escalated)" },
];

export function DistributionChart({
  data,
  loading = false,
}: {
  data: LockBucket[];
  loading?: boolean;
}) {
  const total = data.reduce((s, b) => s + b.GREEN + b.YELLOW + b.RED + b.LOCKED, 0);

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-baseline justify-between gap-3 mobile:flex-col mobile:items-start mobile:gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
            Where the cohort stands — eligibility band by lock window
          </h2>
          <p className="font-sans text-[12px] text-text-tertiary">
            Athletes grouped by NCAA 10/7 risk band across time-to-lock buckets
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 mobile:order-3">
          {LEGEND.map((l) => {
            const vocab = RISK_VOCABULARY[l.key];
            const Icon = vocab.icon;
            return (
              <li key={l.key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} aria-hidden />
                <Icon className="h-3 w-3" style={{ color: l.color }} aria-hidden />
                <span className="font-sans text-[11px] text-text-tertiary">{vocab.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {loading ? (
        <div className="skeleton h-[220px] w-full rounded" aria-busy="true" />
      ) : total === 0 ? (
        <EmptyState />
      ) : (
        <div className="h-[220px] w-full min-w-0">
          <Chart data={data} />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] w-full flex-col items-center justify-center gap-1 rounded border border-dashed border-[color:var(--border-default)] bg-surface-inner">
      <p className="font-sans text-[14px] text-text-secondary">
        No athletes in any band yet — add students from Intake.
      </p>
    </div>
  );
}

export default DistributionChart;

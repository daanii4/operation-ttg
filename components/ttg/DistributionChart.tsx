"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import type { LockBucket } from "@/app/api/cohort/route";

const Chart = dynamic(() => import("./DistributionChartInner"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full animate-pulse rounded bg-surface-inner" />
  ),
});

const LEGEND: Array<{ key: "GREEN" | "YELLOW" | "RED" | "LOCKED"; color: string }> = [
  { key: "GREEN",  color: "var(--band-green)"  },
  { key: "YELLOW", color: "var(--band-yellow)" },
  { key: "RED",    color: "var(--band-red)"    },
  { key: "LOCKED", color: "var(--band-locked)" },
];

export function DistributionChart({ data }: { data: LockBucket[] }) {
  const total = data.reduce(
    (s, b) => s + b.GREEN + b.YELLOW + b.RED + b.LOCKED,
    0
  );

  return (
    <div className="flex flex-col">
      {/* Header row */}
      <div className="mb-4 flex items-baseline justify-between gap-3 mobile:flex-col mobile:items-start mobile:gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
            10/7 Lock-in Countdown Distribution
          </h2>
          <p className="font-sans text-[12px] text-text-tertiary">
            Days until 7th semester start — by risk band
          </p>
        </div>
        <ul className="flex items-center gap-4 mobile:order-3">
          {LEGEND.map((l) => (
            <li key={l.key} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: l.color }}
              />
              <span className="font-sans text-[11px] text-text-tertiary">
                {l.key}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {total === 0 ? (
        <EmptyState />
      ) : (
        <div className="h-[320px] w-full min-w-0 mobile:h-[240px] tablet:h-[280px]">
          <Chart data={data} />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[240px] w-full flex-col items-center justify-center gap-1 rounded bg-surface-inner">
      <p className="font-sans text-[14px] text-text-secondary">
        No cohort data available
      </p>
      <p className="font-sans text-[12px] text-text-tertiary">
        Add students to begin tracking the 10/7 progression.
      </p>
    </div>
  );
}

export default DistributionChart;

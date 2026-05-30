"use client";

import * as React from "react";

export type MobileSortOption = "urgency" | "name" | "grad" | "daysToLock";

const LABELS: Record<MobileSortOption, string> = {
  urgency: "Urgency (default)",
  name: "Name",
  grad: "Grad year",
  daysToLock: "Days to lock",
};

export function RosterMobileSort({
  value,
  onChange,
}: {
  value: MobileSortOption;
  onChange: (v: MobileSortOption) => void;
}) {
  return (
    <label className="flex w-full flex-col gap-1 px-4 pb-2 md:hidden">
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
        Sort by
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MobileSortOption)}
        className="h-11 w-full rounded-lg border border-[color:var(--border-default)] bg-surface-card px-3 font-sans text-[14px] text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
        aria-label="Sort roster by"
      >
        {(Object.keys(LABELS) as MobileSortOption[]).map((key) => (
          <option key={key} value={key}>
            {LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default RosterMobileSort;

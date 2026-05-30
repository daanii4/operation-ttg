"use client";

import type { PacePeriod } from "@/lib/trajectory/build-completion-pace-series";

const OPTIONS: Array<{ value: PacePeriod; label: string }> = [
  { value: "month", label: "Month" },
  { value: "term", label: "Term" },
  { value: "year", label: "Year" },
];

export function PeriodToggle({
  value,
  onChange,
  className,
}: {
  value: PacePeriod;
  onChange: (v: PacePeriod) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Completion pace period"
      className={[
        "flex w-full rounded-lg bg-surface-inner p-1 md:inline-flex md:w-auto",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={[
              "min-h-[44px] flex-1 rounded-md px-4 py-2 font-sans text-[12px] font-medium transition-colors duration-[var(--duration-normal)] ease-[var(--ease-out)] md:min-h-[36px] md:flex-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]",
              selected
                ? "bg-olive-600 text-white shadow-sm"
                : "text-text-secondary hover:bg-olive-100 hover:text-text-primary",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default PeriodToggle;

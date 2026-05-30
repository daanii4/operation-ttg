"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button, FilterChip, UtilityFilterChip } from "@/components/ui/qn";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";
import { RISK_BANDS, type UseRosterFiltersResult } from "./use-roster-filters";

export interface RosterFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: UseRosterFiltersResult;
}

export function RosterFilterSheet({ open, onClose, filters }: RosterFilterSheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden" role="dialog" aria-modal="true" aria-label="Filter roster">
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/40"
      />
      <div className="fixed inset-x-0 bottom-0 z-[65] flex max-h-[80vh] flex-col rounded-t-2xl bg-surface-card shadow-lg">
        <header className="flex items-center justify-between border-b border-[color:var(--border-default)] px-4 py-3">
          <h2 className="text-base font-semibold text-text-primary">Filter</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filter sheet"
            className="flex h-11 w-11 items-center justify-center rounded-md text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <section className="mb-6">
            <h3 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Eligibility
            </h3>
            <div className="flex flex-wrap gap-2">
              {RISK_BANDS.map((b) => (
                <FilterChip
                  key={b}
                  band={b}
                  label={RISK_VOCABULARY[b].label}
                  active={filters.state.bands.has(b)}
                  onToggle={() => filters.toggleBand(b)}
                  disabled={filters.bandCounts[b] === 0}
                  touch
                />
              ))}
              <UtilityFilterChip
                label="A-G flagged"
                active={filters.state.agFlagged}
                onToggle={filters.toggleAgFlagged}
                disabled={filters.agFlaggedCount === 0}
              />
              <UtilityFilterChip
                label="Past lock"
                active={filters.state.pastLock}
                onToggle={filters.togglePastLock}
                disabled={filters.pastLockCount === 0}
              />
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Sport
            </h3>
            <RadioList
              name="sport"
              value={filters.state.sport}
              options={[
                { value: "ALL", label: "All sports" },
                ...filters.sports.map((s) => ({ value: s, label: s })),
              ]}
              onChange={filters.setSport}
            />
          </section>

          <section>
            <h3 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Grad year
            </h3>
            <RadioList
              name="gradYear"
              value={filters.state.gradYear}
              options={[
                { value: "ALL", label: "All grad years" },
                ...filters.gradYears.map((y) => ({ value: String(y), label: String(y) })),
              ]}
              onChange={filters.setGradYear}
            />
          </section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-[color:var(--border-default)] p-4">
          <Button variant="ghost" fullWidth onClick={filters.clearAll}>
            Clear all
          </Button>
          <Button variant="primary" fullWidth onClick={onClose} className="min-h-[48px]">
            Apply
          </Button>
        </footer>
      </div>
    </div>
  );
}

function RadioList({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {options.map((opt) => (
        <li key={opt.value}>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-3 active:bg-surface-inner">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 accent-olive-600"
            />
            <span className="text-[14px] text-text-primary">{opt.label}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export default RosterFilterSheet;

"use client";

/**
 * Roster filter toolbar — Scholars OS pattern.
 *
 * Search + band chips + dropdowns sit on the page surface with a bottom rule.
 * The student table lives in a single Card below (not a second boxed panel).
 */

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button, FilterChip, type Band } from "@/components/ui/qn";
import type { UseRosterFiltersResult } from "./use-roster-filters";

const BANDS: Band[] = ["GREEN", "YELLOW", "RED", "ESCALATED"];

export interface RosterFiltersProps {
  filters: UseRosterFiltersResult;
  totalCount: number;
  filteredCount: number;
  /** Desktop toolbar action (e.g. Add student). Hidden on mobile — use FAB there. */
  addStudentAction?: React.ReactNode;
}

export function RosterFilters({
  filters,
  totalCount,
  filteredCount,
  addStudentAction,
}: RosterFiltersProps) {
  const countLabel =
    filters.activeFilterCount > 0 || filters.state.search.trim()
      ? `Showing ${filteredCount} of ${totalCount} students`
      : `${totalCount} students`;

  return (
    <div className="mb-5 flex flex-col gap-4">
      <div className="relative w-full min-w-0 md:hidden">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)]"
          aria-hidden
        />
        <input
          type="search"
          value={filters.state.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder="Search by student name…"
          aria-label="Search roster"
          className="h-9 w-full min-w-0 rounded-full border border-[var(--border-default)] bg-[var(--surface-inner)] pl-8 pr-3 font-sans text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-quaternary)] focus:border-[var(--olive-600)] focus:bg-[var(--surface-card)] focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]"
        />
      </div>

      <div className="border-b border-[var(--border-default)] pb-4">
        <div className="hidden md:flex md:flex-wrap md:items-center md:gap-3">
          <div className="relative w-[280px] shrink-0">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)]"
              aria-hidden
            />
            <input
              type="search"
              value={filters.state.search}
              onChange={(e) => filters.setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") filters.setSearch("");
              }}
              placeholder="Search by student name…"
              aria-label="Search roster"
              className="h-9 w-full rounded-full border border-[var(--border-default)] bg-[var(--surface-inner)] pl-8 pr-3 font-sans text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-quaternary)] transition-[border-color,box-shadow,background-color] hover:border-[var(--border-hover)] focus:border-[var(--olive-600)] focus:bg-[var(--surface-card)] focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]"
            />
          </div>

          <div
            role="group"
            aria-label="Filter by band"
            className="flex flex-wrap items-center gap-2"
          >
            {BANDS.map((b) => (
              <FilterChip
                key={b}
                band={b}
                active={filters.state.bands.has(b)}
                onToggle={() => filters.toggleBand(b)}
              />
            ))}
          </div>

          <DropdownSelect
            label="Sport"
            value={filters.state.sport}
            options={[
              { value: "ALL", label: "All sports" },
              ...filters.sports.map((s) => ({ value: s, label: s })),
            ]}
            onChange={filters.setSport}
          />

          <DropdownSelect
            label="Grad year"
            value={filters.state.gradYear}
            options={[
              { value: "ALL", label: "All grad years" },
              ...filters.gradYears.map((y) => ({ value: String(y), label: String(y) })),
            ]}
            onChange={filters.setGradYear}
          />

          {filters.activeFilterCount > 0 ? (
            <Button variant="ghost" onClick={filters.clearAll}>
              Clear ({filters.activeFilterCount})
            </Button>
          ) : null}

          {addStudentAction ? (
            <div className="ml-auto hidden shrink-0 md:flex">{addStudentAction}</div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 md:hidden">
          <div
            role="group"
            aria-label="Filter by band"
            className="flex flex-wrap items-center gap-2"
          >
            {BANDS.map((b) => (
              <FilterChip
                key={b}
                band={b}
                active={filters.state.bands.has(b)}
                onToggle={() => filters.toggleBand(b)}
              />
            ))}
          </div>
        </div>

        <p
          className="mt-3 font-sans text-[12px] leading-snug text-[var(--text-tertiary)]"
          aria-live="polite"
        >
          {countLabel}
        </p>
      </div>
    </div>
  );
}

function DropdownSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  const selected = options.find((o) => o.value === value)?.label ?? "All";
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] pr-8 font-sans text-[13px] text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--border-hover)] focus-visible:border-[var(--olive-600)] focus-visible:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]"
        style={{ height: 36, paddingLeft: 12, paddingRight: 32 }}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {label}: {opt.label === selected ? opt.label : opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute right-2 text-[var(--text-tertiary)]"
      />
    </label>
  );
}

export default RosterFilters;

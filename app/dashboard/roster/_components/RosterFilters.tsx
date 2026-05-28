"use client";

/**
 * QuasarNova v1 — §2.2 Roster filter bar (desktop).
 *
 * Sticky below the top bar (top: 56px), hosts the search input, the four
 * BandBadge-aligned FilterChips, the Sport / Grad-year dropdowns, and the
 * conditional "Clear (n)" ghost button.
 */

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button, FilterChip, Input, type Band } from "@/components/ui/qn";
import type { UseRosterFiltersResult } from "./use-roster-filters";

const BANDS: Band[] = ["GREEN", "YELLOW", "RED", "ESCALATED"];

export interface RosterFiltersProps {
  filters: UseRosterFiltersResult;
}

export function RosterFilters({ filters }: RosterFiltersProps) {
  return (
    <div
      className="hidden md:flex md:items-center md:justify-between md:gap-4"
      style={{
        position: "sticky",
        top: 56,
        zIndex: 10,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 16,
      }}
    >
      <div className="flex items-center gap-3" style={{ width: 280 }}>
        <Input
          aria-label="Search roster"
          placeholder="Search by student name…"
          value={filters.state.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          icon={Search}
          onKeyDown={(e) => {
            if (e.key === "Escape") filters.setSearch("");
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filter by band" className="flex items-center gap-2">
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
      </div>
    </div>
  );
}

/**
 * Lightweight outline-styled select. Wraps a native <select> for accessibility
 * (keyboard / screen-reader behavior is free) but adds the v1 chrome via the
 * label-on-button + caret affordance.
 */
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
        className="appearance-none rounded-md border bg-white pr-8 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
        style={{
          height: 36,
          paddingLeft: 12,
          paddingRight: 32,
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
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
        style={{
          position: "absolute",
          right: 8,
          color: "var(--color-muted)",
          pointerEvents: "none",
        }}
      />
    </label>
  );
}

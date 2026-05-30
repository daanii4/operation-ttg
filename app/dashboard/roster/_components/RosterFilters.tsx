"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { FilterChip, UtilityFilterChip } from "@/components/ui/qn/FilterChip";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";
import {
  ROSTER_CHROME_TOP_PX,
  ROSTER_FILTER_BAR_HEIGHT_PX,
} from "./roster-layout";
import { HOLISTIC_BANDS, type UseRosterFiltersResult } from "./use-roster-filters";

export interface RosterFiltersProps {
  filters: UseRosterFiltersResult;
  filteredCount: number;
  addStudentAction?: React.ReactNode;
  mobile?: boolean;
}

export function RosterFilters({
  filters,
  filteredCount,
  addStudentAction,
  mobile = false,
}: RosterFiltersProps) {
  const allBandsActive =
    filters.state.bands.size === 0 && !filters.state.agFlagged && !filters.state.pastLock;

  const chipRow = (
    <div
      role="group"
      aria-label="Filter athletes by eligibility"
      className={[
        "flex items-center gap-2",
        mobile ? "qn-no-scrollbar -mx-1 overflow-x-auto pb-1" : "flex-wrap",
      ].join(" ")}
    >
      <UtilityFilterChip
        label="All"
        active={allBandsActive}
        onToggle={filters.setAllBands}
      />
      {HOLISTIC_BANDS.map((b) => (
        <FilterChip
          key={b}
          band={b}
          label={b === "ESCALATED" ? RISK_VOCABULARY.ESCALATED.label : RISK_VOCABULARY[b].label}
          active={filters.state.bands.has(b)}
          onToggle={() => filters.toggleBand(b)}
          disabled={filters.bandCounts[b] === 0}
          touch={mobile}
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
  );

  return (
    <div
      className="sticky z-20 border-b border-[color:var(--border-default)] bg-surface-card"
      style={{ top: ROSTER_CHROME_TOP_PX, minHeight: ROSTER_FILTER_BAR_HEIGHT_PX }}
    >
      <div
        className={[
          "flex flex-col gap-3 py-3",
          mobile ? "px-4" : "flex-row flex-wrap items-center justify-between gap-x-4",
        ].join(" ")}
      >
        <div className={mobile ? "w-full" : "flex min-w-0 flex-1 flex-wrap items-center gap-3"}>
          <div className="relative w-full min-w-[200px] max-w-md shrink-0">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-quaternary"
              aria-hidden
            />
            <input
              type="search"
              value={filters.state.search}
              onChange={(e) => filters.setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") filters.setSearch("");
              }}
              placeholder="Search athletes…"
              aria-label="Search athletes"
              className="h-9 w-full rounded-full border-0 bg-surface-inner pl-9 pr-3 font-sans text-[13px] text-text-primary outline-none placeholder:text-text-quaternary transition-[box-shadow,background-color] duration-[var(--duration-instant)] focus:bg-surface-card focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)] mobile:text-[16px]"
            />
          </div>
          {!mobile ? chipRow : null}
        </div>

        <div
          className={[
            "flex shrink-0 items-center gap-3",
            mobile ? "w-full justify-between" : "",
          ].join(" ")}
        >
          <p
            className="font-mono text-[12px] text-text-tertiary transition-opacity duration-[var(--duration-normal)]"
            aria-live="polite"
          >
            {filteredCount} athlete{filteredCount === 1 ? "" : "s"}
          </p>
          {!mobile && addStudentAction ? (
            <div className="hidden shrink-0 md:flex">{addStudentAction}</div>
          ) : null}
        </div>

        {mobile ? chipRow : null}
      </div>
    </div>
  );
}

export default RosterFilters;

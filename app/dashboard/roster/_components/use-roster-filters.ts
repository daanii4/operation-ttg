"use client";

import * as React from "react";
import type { Band } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export interface RosterFilterState {
  search: string;
  bands: Set<Band>;
  sport: string; // "ALL" or sport name
  gradYear: string; // "ALL" or numeric year string
}

export interface UseRosterFiltersResult {
  state: RosterFilterState;
  setSearch: (v: string) => void;
  toggleBand: (b: Band) => void;
  setSport: (v: string) => void;
  setGradYear: (v: string) => void;
  clearAll: () => void;
  removeFilter: (kind: "band" | "sport" | "gradYear" | "search", value?: string) => void;
  filtered: QnRosterRow[];
  activeFilterCount: number;
  sports: string[];
  gradYears: number[];
  /** Compact list of active filter chips for the mobile strip / desktop "Clear (n)". */
  activeChips: Array<{
    kind: "band" | "sport" | "gradYear" | "search";
    value: string;
    label: string;
  }>;
}

const initialState: RosterFilterState = {
  search: "",
  bands: new Set<Band>(),
  sport: "ALL",
  gradYear: "ALL",
};

export function useRosterFilters(rows: QnRosterRow[]): UseRosterFiltersResult {
  const [search, setSearchRaw] = React.useState(initialState.search);
  const [bands, setBands] = React.useState<Set<Band>>(initialState.bands);
  const [sport, setSport] = React.useState(initialState.sport);
  const [gradYear, setGradYear] = React.useState(initialState.gradYear);

  const sports = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.sport);
    return Array.from(set).sort();
  }, [rows]);

  const gradYears = React.useMemo(() => {
    const set = new Set<number>();
    for (const r of rows) set.add(r.graduationYear);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (q.length > 0) {
        const hay = `${row.fullName} ${row.sport} ${row.highSchoolName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (bands.size > 0 && !bands.has(row.band)) return false;
      if (sport !== "ALL" && row.sport !== sport) return false;
      if (gradYear !== "ALL" && String(row.graduationYear) !== gradYear) return false;
      return true;
    });
  }, [rows, search, bands, sport, gradYear]);

  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (bands.size > 0 ? bands.size : 0) +
    (sport !== "ALL" ? 1 : 0) +
    (gradYear !== "ALL" ? 1 : 0);

  const activeChips = React.useMemo(() => {
    const out: UseRosterFiltersResult["activeChips"] = [];
    if (search.trim()) out.push({ kind: "search", value: search, label: `“${search.trim()}”` });
    bands.forEach((b) => out.push({ kind: "band", value: b, label: b }));
    if (sport !== "ALL") out.push({ kind: "sport", value: sport, label: sport });
    if (gradYear !== "ALL") {
      out.push({ kind: "gradYear", value: gradYear, label: `Class of ${gradYear}` });
    }
    return out;
  }, [search, bands, sport, gradYear]);

  const setSearch = React.useCallback((v: string) => setSearchRaw(v), []);
  const toggleBand = React.useCallback((b: Band) => {
    setBands((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }, []);

  const clearAll = React.useCallback(() => {
    setSearchRaw("");
    setBands(new Set());
    setSport("ALL");
    setGradYear("ALL");
  }, []);

  const removeFilter = React.useCallback(
    (kind: "band" | "sport" | "gradYear" | "search", value?: string) => {
      if (kind === "search") setSearchRaw("");
      if (kind === "band" && value) {
        setBands((prev) => {
          const next = new Set(prev);
          next.delete(value as Band);
          return next;
        });
      }
      if (kind === "sport") setSport("ALL");
      if (kind === "gradYear") setGradYear("ALL");
    },
    []
  );

  return {
    state: { search, bands, sport, gradYear },
    setSearch,
    toggleBand,
    setSport,
    setGradYear,
    clearAll,
    removeFilter,
    filtered,
    activeFilterCount,
    sports,
    gradYears,
    activeChips,
  };
}

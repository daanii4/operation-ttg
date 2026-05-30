"use client";

import * as React from "react";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";
import { HOLISTIC_BANDS, type HolisticBand } from "@/lib/roster/holistic-band";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export { HOLISTIC_BANDS };

export interface RosterFilterState {
  search: string;
  debouncedSearch: string;
  bands: Set<HolisticBand>;
  agFlagged: boolean;
  pastLock: boolean;
  sport: string;
  gradYear: string;
}

export interface UseRosterFiltersResult {
  state: RosterFilterState;
  setSearch: (v: string) => void;
  toggleBand: (b: HolisticBand) => void;
  setAllBands: () => void;
  toggleAgFlagged: () => void;
  togglePastLock: () => void;
  setSport: (v: string) => void;
  setGradYear: (v: string) => void;
  clearAll: () => void;
  removeFilter: (
    kind: "band" | "sport" | "gradYear" | "search" | "ag" | "pastLock",
    value?: string
  ) => void;
  filtered: QnRosterRow[];
  activeFilterCount: number;
  sports: string[];
  gradYears: number[];
  bandCounts: Record<HolisticBand, number>;
  agFlaggedCount: number;
  pastLockCount: number;
  activeChips: Array<{
    kind: "band" | "sport" | "gradYear" | "search" | "ag" | "pastLock";
    value: string;
    label: string;
  }>;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function useRosterFilters(rows: QnRosterRow[]): UseRosterFiltersResult {
  const [search, setSearchRaw] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 150);
  const [bands, setBands] = React.useState<Set<HolisticBand>>(new Set());
  const [agFlagged, setAgFlagged] = React.useState(false);
  const [pastLock, setPastLock] = React.useState(false);
  const [sport, setSport] = React.useState("ALL");
  const [gradYear, setGradYear] = React.useState("ALL");

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

  const bandCounts = React.useMemo(() => {
    const counts: Record<HolisticBand, number> = {
      GREEN: 0,
      YELLOW: 0,
      RED: 0,
      ESCALATED: 0,
    };
    for (const r of rows) counts[r.band] += 1;
    return counts;
  }, [rows]);

  const agFlaggedCount = React.useMemo(
    () => rows.filter((r) => r.agDualFlagCount > 0).length,
    [rows]
  );
  const pastLockCount = React.useMemo(
    () => rows.filter((r) => r.riskBand === "LOCKED").length,
    [rows]
  );

  const filtered = React.useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (q.length > 0) {
        const hay = `${row.fullName} ${row.sport} ${row.highSchoolName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (bands.size > 0 && !bands.has(row.band)) return false;
      if (agFlagged && row.agDualFlagCount <= 0) return false;
      if (pastLock && row.riskBand !== "LOCKED") return false;
      if (sport !== "ALL" && row.sport !== sport) return false;
      if (gradYear !== "ALL" && String(row.graduationYear) !== gradYear) return false;
      return true;
    });
  }, [rows, debouncedSearch, bands, agFlagged, pastLock, sport, gradYear]);

  const activeFilterCount =
    (debouncedSearch.trim().length > 0 ? 1 : 0) +
    bands.size +
    (agFlagged ? 1 : 0) +
    (pastLock ? 1 : 0) +
    (sport !== "ALL" ? 1 : 0) +
    (gradYear !== "ALL" ? 1 : 0);

  const activeChips = React.useMemo(() => {
    const out: UseRosterFiltersResult["activeChips"] = [];
    if (debouncedSearch.trim()) {
      out.push({ kind: "search", value: debouncedSearch, label: `“${debouncedSearch.trim()}”` });
    }
    bands.forEach((b) => {
      const label = b === "ESCALATED" ? RISK_VOCABULARY.ESCALATED.label : RISK_VOCABULARY[b].label;
      out.push({ kind: "band", value: b, label });
    });
    if (agFlagged) out.push({ kind: "ag", value: "ag", label: "A-G flagged" });
    if (pastLock) out.push({ kind: "pastLock", value: "pastLock", label: "Past lock" });
    if (sport !== "ALL") out.push({ kind: "sport", value: sport, label: sport });
    if (gradYear !== "ALL") {
      out.push({ kind: "gradYear", value: gradYear, label: `Class of ${gradYear}` });
    }
    return out;
  }, [debouncedSearch, bands, agFlagged, pastLock, sport, gradYear]);

  const setSearch = React.useCallback((v: string) => setSearchRaw(v), []);

  const toggleBand = React.useCallback((b: HolisticBand) => {
    setBands((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }, []);

  const setAllBands = React.useCallback(() => {
    setBands(new Set());
    setAgFlagged(false);
    setPastLock(false);
  }, []);

  const clearAll = React.useCallback(() => {
    setSearchRaw("");
    setBands(new Set());
    setAgFlagged(false);
    setPastLock(false);
    setSport("ALL");
    setGradYear("ALL");
  }, []);

  const removeFilter = React.useCallback(
    (kind: "band" | "sport" | "gradYear" | "search" | "ag" | "pastLock", value?: string) => {
      if (kind === "search") setSearchRaw("");
      if (kind === "band" && value) {
        setBands((prev) => {
          const next = new Set(prev);
          next.delete(value as HolisticBand);
          return next;
        });
      }
      if (kind === "ag") setAgFlagged(false);
      if (kind === "pastLock") setPastLock(false);
      if (kind === "sport") setSport("ALL");
      if (kind === "gradYear") setGradYear("ALL");
    },
    []
  );

  return {
    state: {
      search,
      debouncedSearch,
      bands,
      agFlagged,
      pastLock,
      sport,
      gradYear,
    },
    setSearch,
    toggleBand,
    setAllBands,
    toggleAgFlagged: () => setAgFlagged((v) => !v),
    togglePastLock: () => setPastLock((v) => !v),
    setSport,
    setGradYear,
    clearAll,
    removeFilter,
    filtered,
    activeFilterCount,
    sports,
    gradYears,
    bandCounts,
    agFlaggedCount,
    pastLockCount,
    activeChips,
  };
}

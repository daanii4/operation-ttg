"use client";

import * as React from "react";
import type { CohortStudentRow } from "@/app/api/cohort/route";
import Card from "@/components/ui/Card";
import RosterTable from "@/components/ttg/RosterTable";

const COMPOSITE_BANDS = ["ALL", "CRITICAL", "AT_RISK", "STABLE", "ON_TRACK"] as const;
type CompositeBandFilter = (typeof COMPOSITE_BANDS)[number];

export default function RosterClient({ students }: { students: CohortStudentRow[] }) {
  const [query, setQuery] = React.useState("");
  const [bandFilter, setBandFilter] = React.useState<CompositeBandFilter>("ALL");
  const [sportFilter, setSportFilter] = React.useState<string>("ALL");
  const [gradYearFilter, setGradYearFilter] = React.useState<string>("ALL");

  const sports = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of students) set.add(s.sport);
    return Array.from(set).sort();
  }, [students]);

  const gradYears = React.useMemo(() => {
    const set = new Set<number>();
    for (const s of students) {
      // Approximation: graduation year derived from grade level relative to 2026 demo year.
      const referenceYear = 2026;
      const gradYear = referenceYear + (12 - s.grade);
      set.add(gradYear);
    }
    return Array.from(set).sort();
  }, [students]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (q.length > 0) {
        const hay = `${s.firstName} ${s.lastName} ${s.sport} ${s.highSchoolName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (bandFilter !== "ALL" && s.overallRisk !== bandFilter) return false;
      if (sportFilter !== "ALL" && s.sport !== sportFilter) return false;
      if (gradYearFilter !== "ALL") {
        const referenceYear = 2026;
        const gradYear = referenceYear + (12 - s.grade);
        if (String(gradYear) !== gradYearFilter) return false;
      }
      return true;
    });
  }, [students, query, bandFilter, sportFilter, gradYearFilter]);

  return (
    <Card variant="default" padding="none" className="mt-2 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border-default px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
            Student-Athlete Roster
          </h2>
          <span className="font-sans text-[12px] text-text-tertiary">
            {filtered.length} of {students.length}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, sport, school"
            className="h-9 min-w-[180px] rounded-md border border-border-default bg-white px-3 font-sans text-[12px] text-text-primary focus:border-[var(--olive-600)] focus:outline-none"
          />
          <FilterSelect
            label="Band"
            value={bandFilter}
            onChange={(v) => setBandFilter(v as CompositeBandFilter)}
            options={COMPOSITE_BANDS.map((b) => ({
              value: b,
              label: b === "ALL" ? "All bands" : b.replace("_", " "),
            }))}
          />
          <FilterSelect
            label="Sport"
            value={sportFilter}
            onChange={setSportFilter}
            options={[
              { value: "ALL", label: "All sports" },
              ...sports.map((s) => ({ value: s, label: s })),
            ]}
          />
          <FilterSelect
            label="Grad year"
            value={gradYearFilter}
            onChange={setGradYearFilter}
            options={[
              { value: "ALL", label: "All grad years" },
              ...gradYears.map((y) => ({ value: String(y), label: String(y) })),
            ]}
          />
        </div>
      </div>
      <RosterTable data={filtered} />
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex items-center gap-1 font-sans text-[11px] text-text-tertiary">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-border-default bg-white px-2 font-sans text-[12px] text-text-primary focus:border-[var(--olive-600)] focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

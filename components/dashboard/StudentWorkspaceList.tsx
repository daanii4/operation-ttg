"use client";

/**
 * Student list column for Trajectory / Eligibility / Briefings (desktop).
 * Renders inside StudentWorkspaceLayout — not a separate white panel.
 */

import * as React from "react";
import { Search } from "lucide-react";
import { ActionWindowPill, BandBadge } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export interface StudentWorkspaceListProps {
  rows: QnRosterRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  title?: string;
  hideBand?: boolean;
  ariaLabel?: string;
}

export function StudentWorkspaceList({
  rows,
  selectedId,
  onSelect,
  title = "Students",
  hideBand = false,
  ariaLabel,
}: StudentWorkspaceListProps) {
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.fullName} ${r.sport}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div
      className="flex w-[280px] shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--surface-card)] lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-72px)] lg:w-[320px]"
      aria-label={ariaLabel ?? `${title} list`}
    >
      <div className="border-b border-[var(--border-default)] px-4 py-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[16px] font-normal leading-tight text-[var(--text-primary)]">
            {title}
          </h2>
          <span className="font-sans text-[12px] text-[var(--text-tertiary)]">
            {filtered.length}
          </span>
        </div>
        <div className="relative mt-3 w-full">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter students"
            aria-label={`Filter ${title.toLowerCase()}`}
            className="h-9 w-full rounded-full border border-[var(--border-default)] bg-[var(--surface-inner)] pl-9 pr-3 font-sans text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-quaternary)] transition-[border-color,box-shadow,background-color] hover:border-[var(--border-hover)] focus:border-[var(--olive-600)] focus:bg-[var(--surface-card)] focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]"
          />
        </div>
      </div>

      <ul role="list" className="min-h-0 flex-1 overflow-y-auto">
        {filtered.map((row) => {
          const selected = selectedId === row.studentId;
          return (
            <li key={row.studentId}>
              <button
                type="button"
                onClick={() => onSelect(row.studentId)}
                aria-current={selected ? "true" : undefined}
                className="relative w-full text-left transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-inner)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--olive-600)]"
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-default)",
                  background: selected ? "var(--color-green-tint)" : "transparent",
                }}
              >
                {selected ? (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 top-0 w-[3px] bg-[var(--color-green)]"
                  />
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`truncate text-[13px] font-semibold leading-5 ${
                      selected ? "text-[var(--color-green)]" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {row.fullName}
                  </span>
                  {!hideBand ? <BandBadge band={row.band} /> : null}
                </div>
                <div className="mt-1 flex items-center gap-2 font-sans text-[12px] text-[var(--text-tertiary)]">
                  <span className="truncate">
                    {row.sport} · {row.graduationYear}
                  </span>
                  {row.weeksToCriticalAction != null && row.weeksToCriticalAction <= 4 ? (
                    <ActionWindowPill weeks={row.weeksToCriticalAction} />
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default StudentWorkspaceList;

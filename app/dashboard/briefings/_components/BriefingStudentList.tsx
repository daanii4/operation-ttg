"use client";

/**
 * QuasarNova v1 — §4.2 Briefings student list (desktop left panel).
 *
 * 320px wide scrollable list. Header shows the student count and a compact
 * filter input. Rows are pre-sorted upstream (ESCALATED-first) so this
 * component is purely presentational. Selected row gets the 3px green accent
 * bar + #F0FDF4 background.
 */

import * as React from "react";
import { Search } from "lucide-react";
import { ActionWindowPill, BandBadge, Input } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export interface BriefingStudentListProps {
  rows: QnRosterRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function BriefingStudentList({
  rows,
  selectedId,
  onSelect,
}: BriefingStudentListProps) {
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.fullName} ${r.sport}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <aside
      aria-label="Students with briefings"
      className="hidden md:flex md:flex-col"
      style={{
        width: 320,
        flexShrink: 0,
        background: "var(--surface-card)",
        borderRight: "1px solid var(--border-default)",
        // Account for the 56px desktop top bar so the list scrolls within
        // its own column without pushing the page.
        height: "calc(100vh - 56px)",
        position: "sticky",
        top: 56,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div className="flex items-baseline justify-between">
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Students
          </h2>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {filtered.length}
          </span>
        </div>
        <div className="mt-3">
          <Input
            aria-label="Filter students"
            placeholder="Filter students"
            icon={Search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <ul role="list" className="flex-1 overflow-y-auto">
        {filtered.map((row) => {
          const selected = selectedId === row.studentId;
          return (
            <li key={row.studentId}>
              <button
                type="button"
                onClick={() => onSelect(row.studentId)}
                aria-current={selected ? "true" : undefined}
                className="qn-briefing-row relative w-full text-left transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-inner)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--olive-600)]"
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-default)",
                  background: selected ? "var(--color-green-tint)" : "var(--surface-card)",
                }}
              >
                {selected ? (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: "var(--color-green)",
                    }}
                  />
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="truncate text-[13px] font-semibold leading-5"
                    style={{ color: selected ? "var(--color-green)" : "var(--text-primary)" }}
                  >
                    {row.fullName}
                  </span>
                  <BandBadge band={row.band} />
                </div>
                <div
                  className="mt-1 flex items-center gap-2"
                  style={{ fontSize: 12, color: "var(--text-tertiary)" }}
                >
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
    </aside>
  );
}

export default BriefingStudentList;

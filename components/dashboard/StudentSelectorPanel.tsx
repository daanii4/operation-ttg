"use client";

/**
 * Sprint 6 — shared student selector panel.
 *
 * Used by the Briefings, Trajectory, and Eligibility tabs (desktop only).
 * 320px wide scrollable list with a header (title + count + filter input).
 * Pre-sorted by the caller; the panel is purely presentational.
 *
 * Visual contract matches QuasarNova v1 §4.2:
 *   - selected row gets a 3px green accent bar + #F0FDF4 background.
 *   - inactive rows: 1px bottom divider, hover bg #F9FAFB.
 *   - keyboard focus: 2px green ring inset.
 */

import * as React from "react";
import { Search } from "lucide-react";
import { ActionWindowPill, BandBadge, Input } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export interface StudentSelectorPanelProps {
  rows: QnRosterRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Title text in the header. Defaults to "Students". */
  title?: string;
  /** Hide the BandBadge column (e.g. for Eligibility where the band is less relevant). */
  hideBand?: boolean;
}

export function StudentSelectorPanel({
  rows,
  selectedId,
  onSelect,
  title = "Students",
  hideBand = false,
}: StudentSelectorPanelProps) {
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
      aria-label={`${title} list`}
      className="hidden md:flex md:flex-col"
      style={{
        width: 320,
        flexShrink: 0,
        background: "var(--color-bg)",
        borderRight: "1px solid var(--color-border)",
        // Sticky inside the QnShell main column. 56px = top bar height.
        height: "calc(100vh - 56px)",
        position: "sticky",
        top: 56,
      }}
    >
      <div style={{ padding: 16, borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {title}
          </h2>
          <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
            {filtered.length}
          </span>
        </div>
        <div className="mt-3">
          <Input
            aria-label={`Filter ${title.toLowerCase()}`}
            placeholder="Filter students"
            icon={Search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ height: 32 }}
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
                className="relative w-full text-left transition-colors duration-[120ms] ease-out hover:bg-[var(--color-row-alt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--color-border)",
                  background: selected ? "var(--color-green-tint)" : "var(--color-bg)",
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
                    style={{ color: selected ? "var(--color-green)" : "var(--color-text)" }}
                  >
                    {row.fullName}
                  </span>
                  {!hideBand ? <BandBadge band={row.band} /> : null}
                </div>
                <div
                  className="mt-1 flex items-center gap-2"
                  style={{ fontSize: 12, color: "var(--color-muted)" }}
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

export default StudentSelectorPanel;

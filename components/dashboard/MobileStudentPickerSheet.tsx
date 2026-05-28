"use client";

/**
 * Sprint 6 — shared mobile student picker sheet.
 *
 * Full-height bottom sheet with a search input and the same student list
 * pattern as the desktop selector panel. Tapping a row selects + closes.
 *
 * Originally built for the Briefings tab in Sprint 5; promoted to a shared
 * component in Sprint 6 so Trajectory and Eligibility can mount the same
 * picker without copy/paste drift.
 */

import * as React from "react";
import { Search, X } from "lucide-react";
import { ActionWindowPill, BandBadge } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export interface MobileStudentPickerSheetProps {
  open: boolean;
  onClose: () => void;
  rows: QnRosterRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MobileStudentPickerSheet({
  open,
  onClose,
  rows,
  selectedId,
  onSelect,
}: MobileStudentPickerSheetProps) {
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.fullName} ${r.sport}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

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
    <div className="md:hidden" role="dialog" aria-modal="true" aria-label="Pick student">
      <div
        aria-hidden
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }}
      />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          top: 0,
          background: "var(--surface-card)",
          zIndex: 65,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          className="flex items-center justify-between"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-default)",
            height: 52,
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Select student
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close picker"
            className="flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="border-b border-[var(--border-default)] px-4 py-2">
          <div className="relative w-full">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)]"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students"
              aria-label="Search students"
              autoFocus
              className="h-11 w-full rounded-full border border-[var(--border-default)] bg-[var(--surface-inner)] pl-9 pr-3 font-sans text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-quaternary)] focus:border-[var(--olive-600)] focus:bg-[var(--surface-card)] focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]"
            />
          </div>
        </div>

        <ul role="list" className="flex-1 overflow-y-auto">
          {filtered.map((row) => {
            const selected = row.studentId === selectedId;
            return (
              <li key={row.studentId}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(row.studentId);
                    onClose();
                  }}
                  className="relative w-full text-left active:bg-[var(--surface-inner)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--olive-600)]"
                  style={{
                    padding: "14px 16px",
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
                      className="truncate"
                      style={{
                        fontSize: 15,
                        lineHeight: "20px",
                        fontWeight: 600,
                        color: selected ? "var(--color-green)" : "var(--text-primary)",
                      }}
                    >
                      {row.fullName}
                    </span>
                    <BandBadge band={row.band} />
                  </div>
                  <div
                    className="mt-1 flex items-center gap-2"
                    style={{ fontSize: 13, color: "var(--text-tertiary)" }}
                  >
                    <span className="truncate">
                      {row.sport} · Class of {row.graduationYear}
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
    </div>
  );
}

export default MobileStudentPickerSheet;

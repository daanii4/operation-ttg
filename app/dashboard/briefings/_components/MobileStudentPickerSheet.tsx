"use client";

/**
 * QuasarNova v1 — §5.2 mobile student picker sheet.
 *
 * Full-height bottom sheet with a search input and the same student list
 * pattern as the desktop left panel. Tapping a row selects + closes.
 */

import * as React from "react";
import { Search, X } from "lucide-react";
import { ActionWindowPill, BandBadge, Input } from "@/components/ui/qn";
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
          background: "var(--color-bg)",
          zIndex: 65,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          className="flex items-center justify-between"
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
            height: 52,
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
            Select student
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close picker"
            className="flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
            style={{ color: "var(--color-muted)" }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--color-border)" }}>
          <Input
            mobile
            pill
            icon={Search}
            placeholder="Search students"
            aria-label="Search students"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
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
                  className="relative w-full text-left active:bg-[var(--color-row-alt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
                  style={{
                    padding: "14px 16px",
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
                      className="truncate"
                      style={{
                        fontSize: 15,
                        lineHeight: "20px",
                        fontWeight: 600,
                        color: selected ? "var(--color-green)" : "var(--color-text)",
                      }}
                    >
                      {row.fullName}
                    </span>
                    <BandBadge band={row.band} />
                  </div>
                  <div
                    className="mt-1 flex items-center gap-2"
                    style={{ fontSize: 13, color: "var(--color-muted)" }}
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

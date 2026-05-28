"use client";

/**
 * QuasarNova v1 — §5.2 mobile student selector.
 *
 * Three-column strip: Prev | tappable name (opens picker sheet) | Next.
 * Prev / Next disabled at list boundaries. The center column is the primary
 * affordance — tapping it opens the picker sheet.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export interface MobileStudentSelectorProps {
  selected: QnRosterRow | null;
  rows: QnRosterRow[];
  onSelect: (id: string) => void;
  onOpenPicker: () => void;
}

export function MobileStudentSelector({
  selected,
  rows,
  onSelect,
  onOpenPicker,
}: MobileStudentSelectorProps) {
  const idx = selected ? rows.findIndex((r) => r.studentId === selected.studentId) : -1;
  const prev = idx > 0 ? rows[idx - 1] : null;
  const next = idx >= 0 && idx < rows.length - 1 ? rows[idx + 1] : null;

  return (
    <div
      className="md:hidden flex items-center justify-between"
      style={{
        height: 56,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 52,
        zIndex: 15,
      }}
    >
      <button
        type="button"
        aria-label="Previous student"
        disabled={!prev}
        onClick={() => prev && onSelect(prev.studentId)}
        className="flex h-11 w-11 items-center justify-center disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
        style={{ color: "var(--color-text)" }}
      >
        <ChevronLeft size={20} aria-hidden />
      </button>

      <button
        type="button"
        onClick={onOpenPicker}
        aria-haspopup="dialog"
        className="flex flex-1 flex-col items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
        style={{ height: "100%" }}
      >
        <span
          className="truncate"
          style={{
            fontSize: 15,
            lineHeight: "20px",
            fontWeight: 600,
            color: "var(--color-text)",
            maxWidth: "60vw",
          }}
        >
          {selected?.fullName ?? "Select student"}
        </span>
        {selected ? (
          <span style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
            {selected.sport} · Class of {selected.graduationYear}
          </span>
        ) : null}
      </button>

      <button
        type="button"
        aria-label="Next student"
        disabled={!next}
        onClick={() => next && onSelect(next.studentId)}
        className="flex h-11 w-11 items-center justify-center disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
        style={{ color: "var(--color-text)" }}
      >
        <ChevronRight size={20} aria-hidden />
      </button>
    </div>
  );
}

export default MobileStudentSelector;

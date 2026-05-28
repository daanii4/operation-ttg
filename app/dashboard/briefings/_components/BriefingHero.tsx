"use client";

/**
 * QuasarNova v1 — §4.3 Section A (Briefing hero header).
 *
 * DM Serif Display 24px student name, BandBadge + ActionWindowPill, muted
 * meta line ("Football · Class of 2026 · Updated 9 minutes ago"), and the
 * Export PDF button to the right.
 *
 * ESCALATED override: a 4px left border + AlertTriangle row above the export
 * button. The override is the non-color cue per §1.1 — color alone never
 * carries the urgency.
 */

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  ActionWindowPill,
  BandBadge,
  type Band,
} from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export interface BriefingHeroProps {
  student: QnRosterRow;
  /** Resting label for the meta line, e.g. "Updated 9 minutes ago". */
  updatedRelative?: string;
  exportButton?: React.ReactNode;
  /** Override the band when the F12 result reports a different value. */
  bandOverride?: Band;
  weeksOverride?: number | null;
  embedded?: boolean;
}

export function BriefingHero({
  student,
  updatedRelative,
  exportButton,
  bandOverride,
  weeksOverride,
  embedded = false,
}: BriefingHeroProps) {
  const band = bandOverride ?? student.band;
  const weeks = weeksOverride === undefined ? student.weeksToCriticalAction : weeksOverride;
  const isEscalated = band === "ESCALATED";

  return (
    <section
      style={{
        padding: embedded ? "20px 24px" : "24px 28px",
        borderBottom: "1px solid var(--border-default)",
        borderLeft: isEscalated ? "4px solid var(--color-escalated)" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1
            className="font-serif"
            style={{
              fontSize: 24,
              lineHeight: "32px",
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {student.fullName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <BandBadge band={band} />
            <ActionWindowPill weeks={weeks} />
            <p
              style={{
                fontSize: 12,
                lineHeight: "16px",
                color: "var(--text-tertiary)",
              }}
            >
              {student.sport} · Class of {student.graduationYear}
              {updatedRelative ? ` · Updated ${updatedRelative}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isEscalated ? (
            <span
              role="status"
              className="inline-flex items-center gap-1.5"
              style={{ color: "var(--color-escalated)" }}
            >
              <AlertTriangle size={20} aria-hidden />
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                ESCALATED — Highest urgency
              </span>
            </span>
          ) : null}
          {exportButton}
        </div>
      </div>
    </section>
  );
}

export default BriefingHero;

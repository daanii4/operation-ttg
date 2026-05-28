"use client";

/**
 * QuasarNova v1 — §3.2 Roster mobile card list.
 *
 * Borderless list-row pattern (no individual card chrome — just bottom
 * borders) so the page reads as one continuous list rather than a deck of
 * cards. Each row is a 44px+ tap target and pushes to the student profile.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { ActionWindowPill, BandBadge } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

export interface RosterCardListProps {
  rows: QnRosterRow[];
}

export function RosterCardList({ rows }: RosterCardListProps) {
  const router = useRouter();
  return (
    <ul role="list" className="md:hidden">
      {rows.map((row) => (
        <li key={row.studentId}>
          <button
            type="button"
            onClick={() => router.push(`/students/${row.studentId}`)}
            className="w-full text-left transition-colors duration-[120ms] ease-out active:bg-[var(--color-row-alt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
            style={{
              minHeight: 72,
              padding: "14px 16px",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-bg)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="truncate"
                style={{
                  fontSize: 15,
                  lineHeight: "20px",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                {row.fullName}
              </span>
              <BandBadge band={row.band} />
            </div>
            <div
              className="mt-1 flex items-center gap-2"
              style={{ fontSize: 13, lineHeight: "20px", color: "var(--color-muted)" }}
            >
              <span className="truncate">{row.sport}</span>
              <span aria-hidden>·</span>
              {row.weeksToCriticalAction != null && row.weeksToCriticalAction <= 4 ? (
                <ActionWindowPill weeks={row.weeksToCriticalAction} />
              ) : (
                <span style={{ color: "var(--color-muted)" }}>On track</span>
              )}
            </div>
            {row.primaryConcern && row.band !== "GREEN" ? (
              <p
                className="mt-1 truncate"
                style={{ fontSize: 12, lineHeight: "16px", color: "var(--color-muted)" }}
              >
                {row.primaryConcern}
              </p>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default RosterCardList;

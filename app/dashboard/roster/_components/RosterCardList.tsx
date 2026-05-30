"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { ActionWindowPill, BandBadge } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import type { RiskBand } from "@/components/ttg/risk-vocabulary";

export interface RosterCardListProps {
  rows: QnRosterRow[];
}

function spineColor(band: RiskBand): string {
  switch (band) {
    case "GREEN":
      return "var(--color-green)";
    case "YELLOW":
      return "var(--color-yellow)";
    case "RED":
      return "var(--color-red)";
    case "LOCKED":
      return "var(--color-escalated)";
  }
}

export function RosterCardList({ rows }: RosterCardListProps) {
  const router = useRouter();

  return (
    <ul role="list" className="flex flex-col gap-3 p-4 md:hidden">
      {rows.map((row) => {
        const color = spineColor(row.riskBand);
        const division = row.targetDivision.replace(/_/g, " ");

        return (
          <li key={row.studentId}>
            <button
              type="button"
              onClick={() => router.push(`/students/${row.studentId}`)}
              className={[
                "w-full rounded-lg border-l-4 bg-surface-card p-4 text-left shadow-sm",
                "transition-colors duration-[var(--duration-instant)] ease-[var(--ease-out)]",
                "hover:bg-surface-inner active:bg-olive-50",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]",
              ].join(" ")}
              style={{ minHeight: 48, borderLeftColor: color }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-serif text-[15px] font-semibold leading-tight text-text-primary">
                  {row.fullName}
                </span>
                <BandBadge band={row.riskBand} />
              </div>

              <p className="mt-1 font-sans text-[12px] text-text-tertiary">
                Grade {row.grade} · {row.sport} · {row.graduationYear}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {row.riskBand === "LOCKED" ? (
                  <span className="font-mono text-[12px] font-medium text-band-pivot">Past lock</span>
                ) : row.weeksToCriticalAction != null && row.weeksToCriticalAction <= 4 ? (
                  <ActionWindowPill weeks={row.weeksToCriticalAction} />
                ) : row.daysToLock != null ? (
                  <span className="font-mono text-[12px] font-medium" style={{ color }}>
                    {row.provisionalFlag ? "~" : ""}
                    {row.daysToLock}d to lock
                  </span>
                ) : null}

                <span className="font-mono text-[12px] text-text-secondary">
                  {row.completedTotal}/10 cores
                </span>

                {row.agDualFlagCount > 0 ? (
                  <Badge band="escalation" size="sm" icon={Flag}>
                    A-G
                  </Badge>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default RosterCardList;

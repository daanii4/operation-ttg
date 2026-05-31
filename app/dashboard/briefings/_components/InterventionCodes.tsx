"use client";

import * as React from "react";
import { selectInterventionRows } from "./use-briefing-data";
import type { F12Result } from "@/lib/calculations/types";

const DOT_TOKEN: Record<"red" | "amber" | "green", string> = {
  red: "var(--status-urgent)",
  amber: "var(--status-support)",
  green: "var(--status-track)",
};

const PRIORITY_ARIA: Record<"red" | "amber" | "green", string> = {
  red: "Immediate priority",
  amber: "Support priority",
  green: "On track",
};

export interface InterventionCodesProps {
  f12: F12Result | null;
  sectionBorder?: boolean;
}

export function InterventionCodes({ f12, sectionBorder }: InterventionCodesProps) {
  const rows = f12 ? selectInterventionRows(f12) : [];
  const onlyOnTrack =
    rows.length === 1 && rows[0]?.code === "NO_ACTION_REQUIRED";

  return (
    <section
      className="px-6 py-5"
      style={{
        borderBottom: sectionBorder ? "1px solid var(--border-default)" : undefined,
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        Intervention actions
      </p>

      {rows.length === 0 ? (
        <p
          className="mt-3 font-sans text-[14px] italic"
          style={{ color: "var(--text-tertiary)" }}
        >
          No intervention codes flagged.
        </p>
      ) : onlyOnTrack ? (
        <div className="mt-3 flex items-start gap-3">
          <span
            aria-label={PRIORITY_ARIA.green}
            className="mt-1.5 inline-block shrink-0 rounded-full"
            style={{ width: 8, height: 8, background: DOT_TOKEN.green }}
          />
          <p className="font-sans text-[14px]" style={{ color: "var(--text-primary)" }}>
            On track; no intervention currently required
          </p>
        </div>
      ) : (
        <ol role="list" className="mt-3 flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.code} className="flex items-start gap-3">
              <span
                aria-label={PRIORITY_ARIA[row.priority]}
                className="mt-1.5 inline-block shrink-0 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: DOT_TOKEN[row.priority],
                }}
              />
              <p className="font-sans text-[14px] leading-5" style={{ color: "var(--text-primary)" }}>
                {row.label}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default InterventionCodes;

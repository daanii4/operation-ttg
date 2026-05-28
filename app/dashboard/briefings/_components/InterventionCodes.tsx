"use client";

/**
 * QuasarNova v1 — §4.3 Section B (Intervention codes).
 *
 * Ordered list. Each row gets a leading priority dot (red / amber / green)
 * and the code label in Geist 13/500. Description renders below the code
 * when it would exceed 40 chars on a single line, otherwise inline.
 */

import * as React from "react";
import {
  INTERVENTION_DESCRIPTIONS,
  selectInterventionRows,
} from "./use-briefing-data";
import type { F12Result } from "@/lib/calculations/types";

const DOT_COLOR: Record<"red" | "amber" | "green", string> = {
  red: "var(--color-red)",
  amber: "var(--color-yellow)",
  green: "var(--color-green)",
};

const INLINE_DESCRIPTION_LIMIT = 40;

export interface InterventionCodesProps {
  f12: F12Result | null;
}

export function InterventionCodes({ f12 }: InterventionCodesProps) {
  const rows = f12 ? selectInterventionRows(f12) : [];

  return (
    <section style={{ padding: "20px 28px" }}>
      <p
        className="text-[11px] font-semibold uppercase"
        style={{ color: "var(--color-muted)", letterSpacing: "0.06em" }}
      >
        Intervention codes
      </p>

      {rows.length === 0 ? (
        <p
          className="mt-3 italic"
          style={{
            background: "var(--color-row-alt)",
            padding: "10px 12px",
            borderRadius: 6,
            fontSize: 13,
            lineHeight: "20px",
            color: "var(--color-muted)",
          }}
        >
          No intervention codes flagged.
        </p>
      ) : (
        <ol role="list" className="mt-3 flex flex-col gap-2.5">
          {rows.map((row) => {
            const description = INTERVENTION_DESCRIPTIONS[row.code];
            const inline = description.length <= INLINE_DESCRIPTION_LIMIT;
            return (
              <li
                key={row.code}
                className="flex items-start gap-3"
                style={{
                  background: "var(--color-row-alt)",
                  padding: "10px 12px",
                  borderRadius: 6,
                }}
              >
                <span
                  aria-hidden
                  className="mt-1 inline-block shrink-0 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: DOT_COLOR[row.priority],
                  }}
                />
                <div className="min-w-0">
                  {inline ? (
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: "20px",
                        color: "var(--color-text)",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{row.label}</span>
                      <span
                        aria-hidden
                        style={{ color: "var(--color-muted)", margin: "0 6px" }}
                      >
                        ·
                      </span>
                      <span style={{ color: "var(--color-muted)" }}>{description}</span>
                    </p>
                  ) : (
                    <>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: "20px",
                          color: "var(--color-text)",
                          fontWeight: 500,
                        }}
                      >
                        {row.label}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          lineHeight: "16px",
                          color: "var(--color-muted)",
                          marginTop: 2,
                        }}
                      >
                        {description}
                      </p>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default InterventionCodes;

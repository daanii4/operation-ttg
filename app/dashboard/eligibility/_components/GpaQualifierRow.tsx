"use client";

/**
 * Sprint 6 / A4-3 — NCAA GPA qualifier row.
 *
 * Two cells (D1 + D2) when the student has both intents, otherwise a single
 * cell. Each cell shows the core GPA in mono + the qualifier status as a
 * pill (FULL_QUALIFIER → green, PARTIAL/ACADEMIC_REDSHIRT → amber,
 * NONQUALIFIER → red).
 */

import * as React from "react";
import type { F4Result } from "@/lib/calculations/f4";
import type { F7Result } from "@/lib/calculations/f7";
import {
  workspaceSectionShell,
  type WorkspaceSectionVariant,
} from "@/lib/ui/workspace-section";

type Tone = "green" | "yellow" | "red";

const TONE: Record<
  Tone,
  { fg: string; bg: string; border: string }
> = {
  green: {
    fg: "var(--color-green)",
    bg: "var(--color-green-tint)",
    border: "var(--color-green)",
  },
  yellow: {
    fg: "var(--color-yellow)",
    bg: "var(--color-yellow-tint)",
    border: "var(--color-yellow)",
  },
  red: {
    fg: "var(--color-red)",
    bg: "var(--color-red-tint)",
    border: "var(--color-red)",
  },
};

const D1_QUALIFIER_LABELS: Record<string, string> = {
  FULL_QUALIFIER: "QUALIFIER",
  ACADEMIC_REDSHIRT: "PARTIAL QUALIFIER",
  NONQUALIFIER: "NON-QUALIFIER",
};

const D2_QUALIFIER_LABELS: Record<string, string> = {
  FULL_QUALIFIER: "QUALIFIER",
  PARTIAL_QUALIFIER: "PARTIAL QUALIFIER",
};

function d1Tone(status: string | null | undefined): Tone {
  if (status === "FULL_QUALIFIER") return "green";
  if (status === "ACADEMIC_REDSHIRT") return "yellow";
  return "red";
}

function d2Tone(status: string | null | undefined): Tone {
  if (status === "FULL_QUALIFIER") return "green";
  return "yellow";
}

export interface GpaQualifierRowProps {
  f4: F4Result | null | undefined;
  f7: F7Result | null | undefined;
  /** Which divisions to render — derived from the student's targetDivision. */
  showD1?: boolean;
  showD2?: boolean;
  variant?: WorkspaceSectionVariant;
}

export function GpaQualifierRow({
  f4,
  f7,
  showD1 = true,
  showD2 = true,
  variant = "card",
}: GpaQualifierRowProps) {
  return (
    <section
      aria-labelledby="gpa-qualifier-heading"
      style={workspaceSectionShell(variant)}
    >
      <header className="flex items-baseline justify-between">
        <h3
          id="gpa-qualifier-heading"
          className="font-serif text-[18px] font-normal leading-snug text-[var(--text-primary)]"
        >
          NCAA Core GPA Qualifier
        </h3>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>F4 · F7</span>
      </header>

      <div
        className="mt-4 grid gap-3"
        style={{
          gridTemplateColumns:
            showD1 && showD2 ? "1fr 1fr" : "1fr",
        }}
      >
        {showD1 ? (
          <Cell
            division="D1"
            gpa={f4?.coreGpaWeighted ?? null}
            statusLabel={D1_QUALIFIER_LABELS[f4?.qualifierStatus ?? ""] ?? "—"}
            statusTone={d1Tone(f4?.qualifierStatus)}
            provisional={f4?.qualifierStatusProvisional ?? false}
            thresholdDetail={
              f4 ? `Full ≥ ${f4.qualifierThresholdFull.toFixed(1)} · Redshirt ≥ ${f4.qualifierThresholdRedshirt.toFixed(1)}` : null
            }
          />
        ) : null}
        {showD2 ? (
          <Cell
            division="D2"
            gpa={f7?.coreGpaWeighted ?? null}
            statusLabel={D2_QUALIFIER_LABELS[f7?.qualifierStatus ?? ""] ?? "—"}
            statusTone={d2Tone(f7?.qualifierStatus)}
            provisional={f7?.qualifierStatusProvisional ?? false}
            thresholdDetail={null}
          />
        ) : null}
      </div>
    </section>
  );
}

function Cell({
  division,
  gpa,
  statusLabel,
  statusTone,
  provisional,
  thresholdDetail,
}: {
  division: "D1" | "D2";
  gpa: number | null;
  statusLabel: string;
  statusTone: Tone;
  provisional: boolean;
  thresholdDetail: string | null;
}) {
  const t = TONE[statusTone];
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 6,
        background: "var(--surface-inner)",
      }}
    >
      <div className="flex items-baseline justify-between">
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-tertiary)",
          }}
        >
          NCAA {division} Core GPA
        </span>
        {provisional ? (
          <span
            style={{
              fontSize: 11,
              fontStyle: "italic",
              color: "var(--color-yellow)",
            }}
          >
            Provisional
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          {gpa != null ? gpa.toFixed(2) : "—"}
        </span>
        <span
          className="inline-flex items-center rounded-full"
          style={{
            padding: "4px 10px",
            background: t.bg,
            border: `1px solid ${t.border}`,
            color: t.fg,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {statusLabel}
        </span>
      </div>
      {thresholdDetail ? (
        <p style={{ marginTop: 8, fontSize: 11, color: "var(--text-tertiary)" }}>
          {thresholdDetail}
        </p>
      ) : null}
    </div>
  );
}

export default GpaQualifierRow;

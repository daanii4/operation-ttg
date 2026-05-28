"use client";

/**
 * Sprint 6 / A4-3 — Completion card.
 *
 * One row per subject area with a label, a segmented completion bar, and a
 * count "completed / required". Color per row: green when met, amber while
 * in progress, red when the deficit is unrecoverable.
 *
 * Used for both the A-G card (F1) and the NCAA D1/D2 cards (F3 / F6). The
 * caller passes an array of `SubjectRow`s — the card itself is agnostic of
 * the framework so we don't fork the visual logic.
 */

import * as React from "react";

export interface SubjectRow {
  key: string;
  label: string;
  completed: number;
  required: number;
  /** Optional override; default tone is derived from completed/required ratio. */
  tone?: "green" | "yellow" | "red";
  /** Optional muted hint shown under the row (e.g. dual-flag warning). */
  hint?: string | null;
}

export interface CompletionCardProps {
  title: string;
  subtitle?: string;
  rows: SubjectRow[];
  /** Right-aligned label after the title (e.g. "F1" or "F3"). */
  source?: string;
}

function deriveTone(row: SubjectRow): "green" | "yellow" | "red" {
  if (row.tone) return row.tone;
  if (row.completed >= row.required) return "green";
  if (row.completed > 0) return "yellow";
  return "red";
}

const TONE_FILL: Record<"green" | "yellow" | "red", string> = {
  green: "var(--color-green)",
  yellow: "var(--color-yellow)",
  red: "var(--color-red)",
};

const TONE_TEXT: Record<"green" | "yellow" | "red", string> = {
  green: "var(--color-green)",
  yellow: "var(--color-yellow)",
  red: "var(--color-red)",
};

export function CompletionCard({
  title,
  subtitle,
  rows,
  source,
}: CompletionCardProps) {
  return (
    <section
      aria-labelledby={`completion-${title.toLowerCase().replace(/\W+/g, "-")}-heading`}
      style={{
        padding: 20,
        background: "var(--color-bg)",
        borderRadius: 8,
        border: "1px solid var(--color-border)",
      }}
    >
      <header className="flex items-baseline justify-between">
        <div>
          <h3
            id={`completion-${title.toLowerCase().replace(/\W+/g, "-")}-heading`}
            className="text-base font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            {title}
          </h3>
          {subtitle ? (
            <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {source ? (
          <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{source}</span>
        ) : null}
      </header>

      <ul role="list" className="mt-4 flex flex-col gap-3">
        {rows.map((row) => (
          <CompletionRow key={row.key} row={row} />
        ))}
      </ul>
    </section>
  );
}

function CompletionRow({ row }: { row: SubjectRow }) {
  const tone = deriveTone(row);
  const segments = Math.max(1, Math.ceil(row.required));
  const filled = Math.max(0, Math.min(segments, Math.round(row.completed)));

  return (
    <li>
      <div className="flex items-center justify-between gap-3">
        <span style={{ fontSize: 13, color: "var(--color-text)" }}>{row.label}</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: TONE_TEXT[tone],
            fontWeight: 600,
          }}
          aria-label={`${row.completed} of ${row.required} completed`}
        >
          {row.completed} / {row.required}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={row.completed}
        aria-valuemin={0}
        aria-valuemax={row.required}
        className="mt-2 flex gap-1"
      >
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background:
                i < filled ? TONE_FILL[tone] : "var(--color-row-alt)",
              border: i < filled ? "none" : "1px solid var(--color-border)",
              transition: "background 200ms ease-out",
            }}
          />
        ))}
      </div>
      {row.hint ? (
        <p
          style={{
            fontSize: 11,
            color: "var(--color-muted)",
            marginTop: 4,
          }}
        >
          {row.hint}
        </p>
      ) : null}
    </li>
  );
}

export default CompletionCard;

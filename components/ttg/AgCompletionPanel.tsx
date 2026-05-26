"use client";

import Card from "@/components/ui/Card";
import Badge, { BandKey } from "@/components/ui/Badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import type { F1Result } from "@/lib/calculations/f1";

const AG_LABELS: Record<string, string> = {
  a: "History / Social Science",
  b: "English",
  c: "Mathematics",
  d: "Laboratory Science",
  e: "Language (LOTE)",
  f: "Visual / Performing Arts",
  g: "College-Prep Elective",
};

type Props = { f1: F1Result };

function bandForComplete(complete: boolean): BandKey {
  return complete ? "green" : "red";
}

export default function AgCompletionPanel({ f1 }: Props) {
  const categories = ["a", "b", "c", "d", "e", "f", "g"];

  return (
    <Card variant="default" padding="lg">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
          California A-G Completion
        </h2>
        <Badge
          band={f1.fullyComplete ? "green" : "yellow"}
          size="md"
          icon={f1.fullyComplete ? CheckCircle : AlertTriangle}
        >
          {f1.evidenceTier}
        </Badge>
      </div>

      <p className="mb-4 font-mono text-[12px] text-text-secondary">
        {f1.totalCompletedYears.toFixed(1)} / {f1.totalRequiredYears} years counted ·{" "}
        {Math.round(f1.completionPct * 100)}% toward 15-year requirement
      </p>

      <div className="grid gap-2 mobile:grid-cols-1 tablet:grid-cols-2">
        {categories.map((cat) => {
          const row = f1.perCategory[cat];
          if (!row) return null;
          return (
            <div
              key={cat}
              className="rounded border border-border bg-surface-inner px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-medium uppercase text-text-secondary">
                  {cat} — {AG_LABELS[cat]}
                </span>
                <Badge
                  band={bandForComplete(row.complete)}
                  size="sm"
                  icon={row.complete ? CheckCircle : AlertTriangle}
                >
                  {row.complete ? "Complete" : `${row.missingYears.toFixed(1)} yr short`}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-[11px] text-text-tertiary">
                {row.completedYears.toFixed(1)} / {row.requiredYears} years
              </p>
              {row.ruleViolations.map((v) => (
                <p key={v.rule} className="mt-1 font-sans text-[12px] text-band-urgent">
                  {v.message}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      {f1.creditRecoveryCandidates.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
            Credit recovery candidates
          </p>
          <ul className="space-y-1">
            {f1.creditRecoveryCandidates.map((c) => (
              <li key={c.courseName} className="font-sans text-[13px] text-text-secondary">
                {c.courseName} ({c.gradeReceived}) — category {c.agCategory}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

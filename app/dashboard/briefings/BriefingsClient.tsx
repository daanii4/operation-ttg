"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge, { type BandKey } from "@/components/ui/Badge";
import type {
  CompositeBand,
  F12Result,
  InterventionCode,
} from "@/lib/calculations/types";
import { INTERVENTION_LABELS } from "@/lib/calculations/intervention-labels";
import { usePdfExport } from "@/lib/hooks/use-pdf-export";

type Row = {
  studentId: string;
  firstName: string;
  lastName: string;
  grade: number;
  sport: string;
  targetDivision: string;
  riskBand: string;
  overallRisk: string;
};

const COMPOSITE_TO_BAND: Record<CompositeBand, BandKey> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  ESCALATED: "escalation",
};

const PRIORITY_DOT: Record<InterventionCode, "red" | "amber" | "green"> = {
  IMMEDIATE_ADVISOR_CONTACT: "red",
  D1_PATHWAY_REVIEW: "amber",
  GPA_RECOVERY_PLAN: "amber",
  AIMS_FOLLOW_UP: "amber",
  MONITOR_ENGAGEMENT: "amber",
  TRANSCRIPT_AUDIT: "amber",
  SCHEDULE_ACADEMIC_SUPPORT: "amber",
  NO_ACTION_REQUIRED: "green",
};

const DOT_COLOR: Record<"red" | "amber" | "green", string> = {
  red: "#DC2626",
  amber: "#D97706",
  green: "#16A34A",
};

export default function BriefingsClient({ students }: { students: Row[] }) {
  return (
    <Card variant="default" padding="none" className="mt-2 overflow-hidden">
      <div className="flex items-baseline justify-between border-b border-border-default px-6 py-4">
        <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
          F12 Master Briefings
        </h2>
        <p className="font-sans text-[12px] text-text-tertiary">
          Click a row to expand intervention codes and export the PDF briefing.
        </p>
      </div>

      <ul className="divide-y divide-border-default">
        {students.map((s) => (
          <BriefingRow key={s.studentId} row={s} />
        ))}
      </ul>
    </Card>
  );
}

function BriefingRow({ row }: { row: Row }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [briefing, setBriefing] = React.useState<F12Result | null>(null);

  const pdf = usePdfExport({ jobType: "student_briefing", studentId: row.studentId });

  const onToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !briefing && !loading) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/students/${row.studentId}/eligibility`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load briefing");
        const json = (await res.json()) as { f12?: F12Result };
        if (!json.f12) throw new Error("No F12 master briefing available");
        setBriefing(json.f12);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <li>
      <div className="flex w-full items-center justify-between gap-3 px-6 py-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 text-left transition-colors hover:bg-[color:var(--surface-inner)]/40"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 text-text-tertiary" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-tertiary" aria-hidden />
          )}
          <div>
            <span className="font-serif text-[14px] text-text-primary">
              {row.firstName} {row.lastName}
            </span>
            <span className="ml-2 font-sans text-[12px] text-text-tertiary">
              Grade {row.grade} · {row.sport} · {row.targetDivision}
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() =>
            pdf.start({
              filenameHint: `briefing-${row.firstName}-${row.lastName}`.toLowerCase(),
            })
          }
          disabled={pdf.isBusy}
          aria-busy={pdf.isBusy}
          className="inline-flex items-center gap-2 rounded-md border border-border-default bg-white px-3 py-1.5 font-sans text-[12px] font-medium text-text-primary transition-colors hover:bg-[color:var(--surface-inner)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pdf.isBusy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {pdf.statusLabel}
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" aria-hidden />
              Download PDF
            </>
          )}
        </button>
      </div>
      {pdf.error && (
        <p
          role="alert"
          className="mx-6 mb-3 rounded border border-band-urgent/30 bg-band-urgent/5 px-3 py-2 font-sans text-[12px] text-band-urgent"
        >
          {pdf.error}
        </p>
      )}
      {open && (
        <div className="border-t border-border-default bg-[color:var(--surface-inner)]/40 px-6 py-5">
          {loading && (
            <p className="flex items-center gap-2 font-mono text-[12px] text-text-tertiary">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Loading briefing…
            </p>
          )}
          {error && (
            <p role="alert" className="font-sans text-[12px] text-band-urgent">
              {error}
            </p>
          )}
          {briefing && <BriefingDetail briefing={briefing} />}
        </div>
      )}
    </li>
  );
}

function BriefingDetail({ briefing }: { briefing: F12Result }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded bg-surface-card p-4 shadow-sm">
        <h3 className="font-serif text-[14px] text-text-primary">Composite Band</h3>
        <div className="mt-3 flex items-center gap-3">
          <Badge band={COMPOSITE_TO_BAND[briefing.composite_band]} size="sm">
            {briefing.composite_band}
          </Badge>
          {briefing.weeks_to_critical_action != null && (
            <span className="font-mono text-[12px] text-text-secondary">
              {briefing.weeks_to_critical_action === 0
                ? "Immediate action required"
                : `~${briefing.weeks_to_critical_action} week(s) to critical action`}
            </span>
          )}
        </div>
        {briefing.primary_concern && (
          <p className="mt-3 font-sans text-[12px] text-text-secondary">
            <span className="font-medium text-text-primary">Primary concern: </span>
            {briefing.primary_concern}
          </p>
        )}
        <p className="mt-2 font-sans text-[11px] text-text-tertiary">
          Briefing version {briefing.briefing_version} · Evidence tier {" "}
          {briefing.overall_evidence_tier}
        </p>
      </div>

      <div className="rounded bg-surface-card p-4 shadow-sm">
        <h3 className="font-serif text-[14px] text-text-primary">Intervention Actions</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {briefing.intervention_codes.map((code) => (
            <li key={code} className="flex items-start gap-2">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ background: DOT_COLOR[PRIORITY_DOT[code] ?? "amber"] }}
                aria-hidden
              />
              <span className="font-sans text-[12px] text-text-primary">
                {INTERVENTION_LABELS[code]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

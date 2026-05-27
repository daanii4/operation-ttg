"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import type { CohortApiResponse } from "@/app/api/cohort/route";
import Card from "@/components/ui/Card";
import EvidenceFootnote from "@/components/ttg/EvidenceFootnote";
import HolisticKpiGrid from "@/components/ttg/HolisticKpiGrid";
import NcaaReadinessCard from "@/components/ttg/NcaaReadinessCard";
import DistributionChart from "@/components/ttg/DistributionChart";
import ApproachingDeadlinesPanel from "@/components/ttg/ApproachingDeadlinesPanel";
import { usePdfExport } from "@/lib/hooks/use-pdf-export";

export default function OverviewClient({ data }: { data: CohortApiResponse }) {
  const cohortExport = usePdfExport({ jobType: "cohort_summary" });

  const weeksSummary = computeWeeksToCriticalActionSummary(data);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-[12px] text-text-tertiary">
          Holistic executive summary · KPI grid · band distribution · weeks to critical action.
        </p>
        <button
          type="button"
          onClick={() =>
            cohortExport.start({
              filenameHint: "cohort-summary",
            })
          }
          disabled={cohortExport.isBusy}
          aria-busy={cohortExport.isBusy}
          className="inline-flex items-center gap-2 self-start rounded-md border border-[var(--olive-600)] bg-[var(--olive-700)] px-3.5 py-2 font-sans text-[12px] font-semibold text-white transition-colors hover:bg-[var(--olive-800)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cohortExport.isBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generating…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" aria-hidden />
              Export Cohort Report
            </>
          )}
        </button>
      </div>
      {cohortExport.error ? (
        <p
          role="alert"
          className="rounded-md border border-band-urgent/40 bg-band-urgent/5 px-3 py-2 font-sans text-[12px] text-band-urgent"
        >
          {cohortExport.error}
        </p>
      ) : null}

      <HolisticKpiGrid summary={data.holisticSummary} className="mt-0" />

      <NcaaReadinessCard summary={data.ncaaReadiness} />

      <Card variant="default" padding="lg" className="mt-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
              Weeks to Critical Action
            </h2>
            <p className="mt-1 font-sans text-[12px] text-text-tertiary">
              Derived from F12 master briefing · escalation = 0 weeks · RED = 1 week.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <SummaryStat label="Escalated (0w)" value={weeksSummary.escalated} tone="urgent" />
          <SummaryStat label="Red (1w)" value={weeksSummary.red} tone="warning" />
          <SummaryStat label="Yellow (~4w)" value={weeksSummary.yellow} tone="muted" />
          <SummaryStat label="Green (—)" value={weeksSummary.green} tone="ok" />
        </div>
      </Card>

      <Card variant="default" padding="lg" className="mt-6">
        <DistributionChart data={data.lockDistributionSeries} />
      </Card>

      <ApproachingDeadlinesPanel deadlines={data.approachingDeadlines} className="mt-6" />

      <div className="mt-6">
        <EvidenceFootnote
          evidenceTier="Deterministic"
          text="All calculations are rule-based against published NCAA authority. No ML, no causal inference."
          sourceUrl="https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/"
          sourceLabel="NCAA Bylaw 14.3"
        />
      </div>
    </>
  );
}

function computeWeeksToCriticalActionSummary(data: CohortApiResponse) {
  let escalated = 0;
  let red = 0;
  let yellow = 0;
  let green = 0;
  for (const student of data.students) {
    if (student.overallRisk === "CRITICAL") {
      escalated += 1;
      continue;
    }
    if (student.riskBand === "RED") {
      red += 1;
      continue;
    }
    if (student.riskBand === "YELLOW") {
      yellow += 1;
      continue;
    }
    green += 1;
  }
  return { escalated, red, yellow, green };
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "urgent" | "warning" | "muted" | "ok";
}) {
  const valueColor =
    tone === "urgent"
      ? "text-band-urgent"
      : tone === "warning"
        ? "text-band-red"
        : tone === "muted"
          ? "text-band-yellow"
          : "text-band-green";
  return (
    <div className="rounded bg-surface-inner p-4">
      <div className="font-sans text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
        {label}
      </div>
      <div className={["mt-2 font-mono text-[24px] font-medium", valueColor].join(" ")}>
        {value}
      </div>
    </div>
  );
}

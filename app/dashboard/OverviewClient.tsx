"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import type { CohortApiResponse } from "@/app/api/cohort/route";
import { OverviewScreen } from "@/components/overview/OverviewScreen";
import { usePdfExport } from "@/lib/hooks/use-pdf-export";

export default function OverviewClient({ data }: { data: CohortApiResponse }) {
  const cohortExport = usePdfExport({ jobType: "cohort_summary" });

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-[12px] text-text-tertiary">
          Lock deadline triage · band lenses · cohort distribution · roster preview.
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
          className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-md border border-[var(--olive-600)] bg-[var(--olive-700)] px-3.5 py-2 font-sans text-[12px] font-semibold text-white transition-colors hover:bg-[var(--olive-800)] disabled:cursor-not-allowed disabled:opacity-60"
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
          className="mb-4 rounded-md border border-[color:var(--status-urgent-border)] bg-status-urgent-tint px-3 py-2 font-sans text-[12px] text-status-urgent"
        >
          {cohortExport.error}
        </p>
      ) : null}

      <OverviewScreen data={data} />
    </>
  );
}

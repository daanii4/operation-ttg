"use client";

import * as React from "react";
import Link from "next/link";
import type { CohortApiResponse } from "@/app/api/cohort/route";
import Card from "@/components/ui/Card";
import EvidenceFootnote from "@/components/ttg/EvidenceFootnote";
import HolisticKpiGrid from "@/components/ttg/HolisticKpiGrid";
import DistributionChart from "@/components/ttg/DistributionChart";
import { RosterTable } from "@/components/ttg/RosterTable";
import { ApproachingLockDeadlines } from "./ApproachingLockDeadlines";

type Props = {
  data: CohortApiResponse;
  loading?: boolean;
};

export function OverviewScreen({ data, loading = false }: Props) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 desktop:px-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Row 1 — hero queue + KPI lenses */}
        <div className="col-span-12 desktop:col-span-8">
          <ApproachingLockDeadlines students={data.students} loading={loading} />
        </div>
        <div className="col-span-12 desktop:col-span-4">
          <HolisticKpiGrid summary={data.holisticSummary} layout="sidebar" className="mt-0" />
        </div>

        {/* Row 2 — band distribution chart */}
        <div className="col-span-12">
          <Card variant="default" padding="lg" className="mt-0">
            <DistributionChart data={data.lockDistributionSeries} loading={loading} />
          </Card>
        </div>

        {/* Row 3 — roster reference */}
        <div className="col-span-12">
          <Card variant="default" padding="none" className="mt-0 overflow-hidden">
            <div className="border-b border-[color:var(--border-default)] px-6 py-4">
              <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">Cohort roster</h2>
              <p className="mt-1 font-sans text-[12px] text-text-tertiary">
                Full caseload preview — open Roster for filters and intake.
              </p>
            </div>
            {loading ? (
              <div className="px-6 py-4" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton mb-2 h-11 w-full rounded" />
                ))}
              </div>
            ) : (
              <RosterTable data={data.students} stickyHeader />
            )}
            <div className="border-t border-[color:var(--border-default)] px-6 py-3">
              <Link
                href="/dashboard/roster"
                className="font-sans text-[13px] font-medium text-gold-600 underline [text-underline-offset:3px] hover:text-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--olive-600)]"
              >
                View full roster
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <EvidenceFootnote
          evidenceTier="Deterministic"
          text="All calculations are rule-based against published NCAA authority. No ML, no causal inference."
          sourceUrl="https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/"
          sourceLabel="NCAA Bylaw 14.3"
        />
      </div>
    </div>
  );
}

export default OverviewScreen;

"use client";
import * as React from "react";
import type { CohortApiResponse } from "@/app/api/cohort/route";
import Card from "@/components/ui/Card";
import RosterTable from "@/components/ttg/RosterTable";
import EvidenceFootnote from "@/components/ttg/EvidenceFootnote";
import HolisticKpiGrid from "@/components/ttg/HolisticKpiGrid";
import ApproachingDeadlinesPanel from "@/components/ttg/ApproachingDeadlinesPanel";
import NcaaReadinessCard from "@/components/ttg/NcaaReadinessCard";

export default function CohortClient({ data }: { data: CohortApiResponse }) {
  return (
    <>
      <HolisticKpiGrid summary={data.holisticSummary} className="mt-0" />

      <NcaaReadinessCard summary={data.ncaaReadiness} />

      <ApproachingDeadlinesPanel
        deadlines={data.approachingDeadlines}
        className="mt-6"
      />

      <div className="mt-6">
        <EvidenceFootnote
          evidenceTier="Deterministic"
          text="All calculations are rule-based against published NCAA authority. No ML, no causal inference."
          sourceUrl="https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/"
          sourceLabel="NCAA Bylaw 14.3"
        />
      </div>

      <Card variant="default" padding="none" className="mt-6 overflow-hidden">
        <div id="roster-anchor" className="flex items-baseline justify-between px-6 py-5">
          <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
            Student-Athlete Roster
          </h2>
          <span className="font-sans text-[12px] text-text-tertiary">
            {data.totalStudents} students
          </span>
        </div>
        <RosterTable data={data.students} />
      </Card>
    </>
  );
}

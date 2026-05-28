import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { sortQnRosterRows, toQnRosterRows } from "@/lib/cohort/qn-roster";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BriefingsPageClient from "./BriefingsPageClient";

export const metadata: Metadata = {
  title: "Briefings · Operation TTG",
};

export default async function BriefingsPage() {
  const data = await buildCohortResponse();
  // List ordering per spec §4.2: ESCALATED → RED → YELLOW → GREEN,
  // then weeks_to_critical_action ascending.
  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  return (
    <DashboardShell
      eyebrow="BRIEFINGS"
      pageTitle="Student Briefings"
      pageSubtitle="F12 master briefing per student"
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Briefings" },
        ]}
      />
      <BriefingsPageClient rows={rows} />
    </DashboardShell>
  );
}

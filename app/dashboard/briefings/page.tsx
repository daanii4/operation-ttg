import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { sortQnRosterRows, toQnRosterRows } from "@/lib/cohort/qn-roster";
import { getAdvisorDisplay } from "@/lib/auth/advisor-identity";
import QnShell from "@/components/layout/qn/QnShell";
import BriefingsPageClient from "./BriefingsPageClient";

export const metadata: Metadata = {
  title: "Briefings · Operation TTG",
};

export default async function BriefingsPage() {
  const [data, advisor] = await Promise.all([
    buildCohortResponse(),
    getAdvisorDisplay(),
  ]);

  // Briefings list ordering follows the spec §4.2: ESCALATED first, then RED,
  // YELLOW, GREEN; within each band by weeks_to_critical_action ascending.
  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  return (
    <QnShell pageTitle="Briefings" advisor={advisor}>
      <BriefingsPageClient rows={rows} />
    </QnShell>
  );
}

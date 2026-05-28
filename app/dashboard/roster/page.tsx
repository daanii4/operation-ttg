import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { toQnRosterRows, sortQnRosterRows } from "@/lib/cohort/qn-roster";
import { getAdvisorDisplay } from "@/lib/auth/advisor-identity";
import QnShell from "@/components/layout/qn/QnShell";
import RosterPageClient from "./RosterPageClient";

export const metadata: Metadata = {
  title: "Roster · Operation TTG",
};

export default async function RosterPage() {
  const [data, advisor] = await Promise.all([
    buildCohortResponse(),
    getAdvisorDisplay(),
  ]);

  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  return (
    <QnShell pageTitle="Roster" advisor={advisor}>
      <RosterPageClient rows={rows} />
    </QnShell>
  );
}

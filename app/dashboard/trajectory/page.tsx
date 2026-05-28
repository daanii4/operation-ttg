import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { sortQnRosterRows, toQnRosterRows } from "@/lib/cohort/qn-roster";
import { getAdvisorDisplay } from "@/lib/auth/advisor-identity";
import QnShell from "@/components/layout/qn/QnShell";
import TrajectoryPageClient from "./TrajectoryPageClient";

export const metadata: Metadata = {
  title: "Trajectory · Operation TTG",
};

export default async function TrajectoryPage() {
  const [data, advisor] = await Promise.all([
    buildCohortResponse(),
    getAdvisorDisplay(),
  ]);

  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  return (
    <QnShell pageTitle="Trajectory" advisor={advisor}>
      <TrajectoryPageClient rows={rows} />
    </QnShell>
  );
}

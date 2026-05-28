import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { sortQnRosterRows, toQnRosterRows } from "@/lib/cohort/qn-roster";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import TrajectoryPageClient from "./TrajectoryPageClient";

export const metadata: Metadata = {
  title: "Trajectory · Operation TTG",
};

export default async function TrajectoryPage() {
  const data = await buildCohortResponse();
  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  return (
    <DashboardShell
      eyebrow="TRAJECTORY"
      pageTitle="GPA Trajectory"
      pageSubtitle="OLS projection · AIMS signal · engagement"
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Trajectory" },
        ]}
      />
      <TrajectoryPageClient rows={rows} />
    </DashboardShell>
  );
}

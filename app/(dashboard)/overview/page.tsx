import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import DashboardShell from "@/components/layout/DashboardShell";
import TtgHeaderActions from "@/components/layout/TtgHeaderActions";
import Breadcrumb from "@/components/layout/Breadcrumb";
import OverviewClient from "@/app/dashboard/OverviewClient";

export const metadata: Metadata = {
  title: "Overview · Operation TTG",
};

export default async function OverviewPage() {
  const data = await buildCohortResponse();
  const computedDate = new Date(data.computedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardShell
      eyebrow="OVERVIEW"
      pageTitle="Cohort Overview"
      pageSubtitle={`${data.totalStudents} student-athletes · Computed ${computedDate} · Evidence tier deterministic`}
      headerActions={<TtgHeaderActions />}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Overview" },
        ]}
      />
      <OverviewClient data={data} />
    </DashboardShell>
  );
}

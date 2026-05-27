import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import DashboardShell from "@/components/layout/DashboardShell";
import TtgHeaderActions from "@/components/layout/TtgHeaderActions";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CohortClient from "./CohortClient";

export const metadata: Metadata = {
  title: "Analytics · Operation TTG",
};

export default async function AnalyticsPage() {
  const data = await buildCohortResponse();
  const computedDate = new Date(data.computedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardShell
      eyebrow="OVERVIEW"
      pageTitle="Cohort Analytics"
      pageSubtitle={`${data.totalStudents} student-athletes · Computed ${computedDate} · Evidence tier deterministic`}
      headerActions={<TtgHeaderActions />}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard/analytics" },
          { label: "Cohort Analytics" },
        ]}
      />
      <CohortClient data={data} />
    </DashboardShell>
  );
}

import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import DashboardShell from "@/components/layout/DashboardShell";
import TtgHeaderActions from "@/components/layout/TtgHeaderActions";
import Breadcrumb from "@/components/layout/Breadcrumb";
import RosterClient from "./RosterClient";

export const metadata: Metadata = {
  title: "Roster · Operation TTG",
};

export default async function RosterPage() {
  const data = await buildCohortResponse();
  const computedDate = new Date(data.computedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardShell
      eyebrow="ROSTER"
      pageTitle="Student-Athlete Roster"
      pageSubtitle={`${data.totalStudents} students · Composite band · Computed ${computedDate}`}
      headerActions={<TtgHeaderActions />}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Roster" },
        ]}
      />
      <RosterClient students={data.students} />
    </DashboardShell>
  );
}

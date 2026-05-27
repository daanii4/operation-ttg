import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import DashboardShell from "@/components/layout/DashboardShell";
import TtgHeaderActions from "@/components/layout/TtgHeaderActions";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BriefingsClient from "./BriefingsClient";

export const metadata: Metadata = {
  title: "Briefings · Operation TTG",
};

export default async function BriefingsPage() {
  const data = await buildCohortResponse();

  return (
    <DashboardShell
      eyebrow="BRIEFINGS"
      pageTitle="Master Briefings"
      pageSubtitle="F12 master briefing per student · intervention codes · action windows · PDF export"
      headerActions={<TtgHeaderActions />}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Briefings" },
        ]}
      />
      <BriefingsClient
        students={data.students.map((s) => ({
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          sport: s.sport,
          targetDivision: s.targetDivision,
          riskBand: s.riskBand,
          overallRisk: s.overallRisk,
        }))}
      />
    </DashboardShell>
  );
}

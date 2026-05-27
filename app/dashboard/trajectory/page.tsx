import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import DashboardShell from "@/components/layout/DashboardShell";
import TtgHeaderActions from "@/components/layout/TtgHeaderActions";
import Breadcrumb from "@/components/layout/Breadcrumb";
import TrajectoryClient from "./TrajectoryClient";

export const metadata: Metadata = {
  title: "Trajectory · Operation TTG",
};

export default async function TrajectoryPage() {
  const data = await buildCohortResponse();

  return (
    <DashboardShell
      eyebrow="TRAJECTORY"
      pageTitle="Trends & Signals"
      pageSubtitle="F9 GPA trajectory · F10 AIMS risk · F11 engagement metrics"
      headerActions={<TtgHeaderActions />}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Trajectory" },
        ]}
      />
      <TrajectoryClient
        students={data.students.map((s) => ({
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          sport: s.sport,
          targetDivision: s.targetDivision,
          riskBand: s.riskBand,
          overallRisk: s.overallRisk,
          gpaTrajectory: s.gpaTrajectory,
          aimsRisk: s.aimsRisk,
          aimsReason: s.aimsReason,
        }))}
      />
    </DashboardShell>
  );
}

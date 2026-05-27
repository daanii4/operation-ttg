import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import DashboardShell from "@/components/layout/DashboardShell";
import TtgHeaderActions from "@/components/layout/TtgHeaderActions";
import Breadcrumb from "@/components/layout/Breadcrumb";
import EligibilityClient from "./EligibilityClient";

export const metadata: Metadata = {
  title: "Eligibility · Operation TTG",
};

export default async function EligibilityPage() {
  const data = await buildCohortResponse();

  return (
    <DashboardShell
      eyebrow="ELIGIBILITY"
      pageTitle="Per-Student Eligibility"
      pageSubtitle="A-G completion · NCAA D1/D2 cores · GPA qualifier bands · F1–F7"
      headerActions={<TtgHeaderActions />}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Eligibility" },
        ]}
      />
      <EligibilityClient
        students={data.students.map((s) => ({
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          sport: s.sport,
          targetDivision: s.targetDivision,
          highSchoolName: s.highSchoolName,
          riskBand: s.riskBand,
          overallRisk: s.overallRisk,
          agStatus: s.agStatus,
        }))}
      />
    </DashboardShell>
  );
}

import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { sortQnRosterRows, toQnRosterRows } from "@/lib/cohort/qn-roster";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import EligibilityPageClient from "./EligibilityPageClient";

export const metadata: Metadata = {
  title: "Eligibility · Operation TTG",
};

export default async function EligibilityPage() {
  const data = await buildCohortResponse();
  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  return (
    <DashboardShell
      eyebrow="ELIGIBILITY"
      pageTitle="Eligibility Detail"
      pageSubtitle="A-G and NCAA subject completion"
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Eligibility" },
        ]}
      />
      <EligibilityPageClient rows={rows} />
    </DashboardShell>
  );
}

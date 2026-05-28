import type { Metadata } from "next";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { sortQnRosterRows, toQnRosterRows } from "@/lib/cohort/qn-roster";
import { getAdvisorDisplay } from "@/lib/auth/advisor-identity";
import QnShell from "@/components/layout/qn/QnShell";
import EligibilityPageClient from "./EligibilityPageClient";

export const metadata: Metadata = {
  title: "Eligibility · Operation TTG",
};

export default async function EligibilityPage() {
  const [data, advisor] = await Promise.all([
    buildCohortResponse(),
    getAdvisorDisplay(),
  ]);

  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  return (
    <QnShell pageTitle="Eligibility" advisor={advisor}>
      <EligibilityPageClient rows={rows} />
    </QnShell>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getTtgSession } from "@/lib/auth/session";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { sortQnRosterRows, toQnRosterRows } from "@/lib/cohort/qn-roster";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import BriefingsPageClient from "./BriefingsPageClient";

export const metadata: Metadata = {
  title: "Briefings · Operation TTG",
};

export default async function BriefingsPage() {
  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") {
    redirect("/login?redirectTo=/dashboard/briefings");
  }
  const profile = await ensureAdvisorProfile(session);

  const data = await buildCohortResponse();
  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  return (
    <DashboardShell
      eyebrow="BRIEFINGS"
      pageTitle="Student Briefings"
      pageSubtitle="F12 master briefing per student"
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Briefings" },
        ]}
      />
      <BriefingsPageClient
        rows={rows}
        sessionUserId={session.userId}
        teamRole={profile.teamRole}
      />
    </DashboardShell>
  );
}

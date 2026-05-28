import type { Metadata } from "next";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getTtgSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/ttg-permissions";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { toQnRosterRows, sortQnRosterRows } from "@/lib/cohort/qn-roster";
import { prismaTtg } from "@/lib/prisma";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import RosterPageClient from "./RosterPageClient";

export const metadata: Metadata = {
  title: "Roster · Operation TTG",
};

export default async function RosterPage() {
  const [data, session, schools] = await Promise.all([
    buildCohortResponse(),
    getTtgSession(),
    prismaTtg.highSchool.findMany({
      select: { id: true, schoolName: true, city: true },
      orderBy: { schoolName: "asc" },
    }),
  ]);
  const rows = sortQnRosterRows(toQnRosterRows(data.students));

  const profile =
    session && session.userId !== "anonymous"
      ? await ensureAdvisorProfile(session).catch(() => null)
      : null;
  const canCreateStudents =
    !!profile && hasPermission(profile.teamRole, "student:write");

  return (
    <DashboardShell
      eyebrow="ROSTER"
      pageTitle="Student Roster"
      pageSubtitle={`${data.totalStudents} student-athletes · Manteca USD`}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Roster" },
        ]}
      />
      <RosterPageClient
        rows={rows}
        canCreateStudents={canCreateStudents}
        schools={schools}
      />
    </DashboardShell>
  );
}

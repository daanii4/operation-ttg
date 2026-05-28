import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTtgSession } from "@/lib/auth/session";
import { getAdvisorDisplay } from "@/lib/auth/advisor-identity";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { hasPermission } from "@/lib/auth/ttg-permissions";
import { listTeam } from "@/lib/team/team-service";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import QnShell from "@/components/layout/qn/QnShell";
import TeamPageClient from "./TeamPageClient";

export const metadata: Metadata = {
  title: "Team · Operation TTG",
};

export default async function TeamSettingsPage() {
  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") {
    redirect("/login?redirectTo=/dashboard/settings/team");
  }

  const profile = await ensureAdvisorProfile(session).catch(() => null);
  // Non-owners are bounced to the read-only Settings page with a query flag
  // the client renders as a 403 toast (per spec §C-4).
  if (!profile || !hasPermission(profile.teamRole, "team:manage")) {
    redirect("/dashboard/settings?error=team_manage_forbidden");
  }

  const [team, cohort, advisorDisplay] = await Promise.all([
    listTeam(session),
    buildCohortResponse(),
    getAdvisorDisplay(),
  ]);

  return (
    <QnShell pageTitle="Team" eyebrow="SETTINGS" advisor={advisorDisplay}>
      <div
        style={{
          maxWidth: 1280,
          marginLeft: "auto",
          marginRight: "auto",
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 24,
          paddingBottom: 28,
        }}
      >
        <TeamPageClient
          callerAdvisorId={session.userId}
          callerRole={profile.teamRole}
          team={team}
          students={cohort.students.map((s) => ({
            studentId: s.studentId,
            firstName: s.firstName,
            lastName: s.lastName,
            sport: s.sport,
            grade: s.grade,
          }))}
        />
      </div>
    </QnShell>
  );
}

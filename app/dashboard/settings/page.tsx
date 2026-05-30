import type { Metadata } from "next";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getTtgSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/ttg-permissions";
import { listTeam } from "@/lib/team/team-service";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import SettingsAccountSection from "./SettingsAccountSection";
import SettingsDistrictsSection from "./SettingsDistrictsSection";
import SettingsTeamSection from "./SettingsTeamSection";
import SettingsThresholdsSection from "./SettingsThresholdsSection";
import SettingsAcknowledgmentAuditSection from "./SettingsAcknowledgmentAuditSection";
import SettingsThresholdAuditSection from "./SettingsThresholdAuditSection";
import SettingsDataFeedsSection from "./SettingsDataFeedsSection";
import SettingsSourceClassSection from "./SettingsSourceClassSection";
import { PermissionNotice } from "@/lib/settings/settings-ui";
import { isDataFeedEnabled } from "@/lib/ingestion/guards";
import { buildCohortResponse } from "@/lib/cohort/build-cohort-response";
import { prismaTtg } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Settings · Operation TTG",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const session = await getTtgSession();
  const isAdmin = session?.role === "ADMIN";

  const profile =
    session && session.userId !== "anonymous"
      ? await ensureAdvisorProfile(session).catch(() => null)
      : null;

  const teamRole = profile?.teamRole ?? "viewer";
  const canManageTeam = profile ? hasPermission(teamRole, "team:manage") : false;

  const team =
    session && session.userId !== "anonymous"
      ? await listTeam(session).catch(() => null)
      : null;

  const teamForbiddenError = searchParams?.error === "team_manage_forbidden";

  const thresholdRows = await prismaTtg.thresholdConfig
    .findMany({ where: { conference: null }, orderBy: { key: "asc" } })
    .then((rows) =>
      rows.map((r) => ({
        id: r.id,
        key: r.key,
        value: r.value,
        description: r.description,
        ticket: r.ticket,
        calibratedBy: r.calibrated_by,
        calibratedAt: r.calibrated_at?.toISOString() ?? null,
      }))
    )
    .catch(() => []);

  const lastIngestion = await prismaTtg.classAFeedJob
    .findFirst({
      where: { status: "complete" },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        provider: true,
        updated_at: true,
        records_written: true,
      },
    })
    .catch(() => null);

  const dataFeedStatus = {
    enabled: isDataFeedEnabled(),
    provider: "transcript_api",
    providerStatus: "stub-pending-mcp-2",
    lastIngestion: lastIngestion
      ? {
          jobId: lastIngestion.id,
          provider: lastIngestion.provider,
          completedAt: lastIngestion.updated_at.toISOString(),
          recordsWritten: lastIngestion.records_written ?? 0,
        }
      : null,
  };

  const cohort = await buildCohortResponse().catch(() => null);
  const defaultStudentId = cohort?.students[0]?.studentId ?? null;

  return (
    <DashboardShell
      eyebrow="SETTINGS"
      pageTitle="Settings"
      pageSubtitle="Roles, thresholds, data provenance, and audit trail"
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 md:px-8">
        {teamForbiddenError ? (
          <PermissionNotice>
            Team management is limited to the program owner. Advisors and viewers can review team
            membership below in read-only mode.
          </PermissionNotice>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <SettingsAccountSection
            email={session?.email ?? null}
            teamRole={profile?.teamRole ?? null}
          />
          <SettingsDistrictsSection isAdmin={isAdmin} />
        </div>

        <SettingsTeamSection
          canManageTeam={canManageTeam}
          team={team}
          callerAdvisorId={session?.userId ?? null}
        />

        <SettingsThresholdsSection canEdit={canManageTeam} initialRows={thresholdRows} />

        <SettingsAcknowledgmentAuditSection teamRole={teamRole} />

        <SettingsThresholdAuditSection teamRole={teamRole} />

        {canManageTeam ? (
          <SettingsDataFeedsSection
            initialStatus={dataFeedStatus}
            defaultStudentId={defaultStudentId}
          />
        ) : null}

        <SettingsSourceClassSection />
      </div>
    </DashboardShell>
  );
}

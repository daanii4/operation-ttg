import type { Metadata } from "next";
import Link from "next/link";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getAdvisorDisplay } from "@/lib/auth/advisor-identity";
import { getTtgSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/ttg-permissions";
import { listTeam } from "@/lib/team/team-service";
import QnShell from "@/components/layout/qn/QnShell";
import SettingsTeamSection from "./SettingsTeamSection";
import SettingsThresholdsSection from "./SettingsThresholdsSection";
import SettingsDataFeedsSection from "./SettingsDataFeedsSection";
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
  const advisor = await getAdvisorDisplay();
  const isAdmin = session?.role === "ADMIN";

  const profile =
    session && session.userId !== "anonymous"
      ? await ensureAdvisorProfile(session).catch(() => null)
      : null;
  const canManageTeam = profile
    ? hasPermission(profile.teamRole, "team:manage")
    : false;

  const team =
    session && session.userId !== "anonymous"
      ? await listTeam(session).catch(() => null)
      : null;

  const teamForbiddenError = searchParams?.error === "team_manage_forbidden";

  // Sprint 7 / Workstream T-5 — load global thresholds server-side.
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

  // Sprint 7 / Workstream A-6 — feed status + default student for the
  // ingestion form. Server-load both so the page hydrates without a flash.
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
    <QnShell pageTitle="Settings" eyebrow="SETTINGS" advisor={advisor}>
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
        {teamForbiddenError ? (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              background: "var(--color-red-tint)",
              borderLeft: "3px solid var(--color-red)",
              borderRadius: 6,
              color: "var(--color-red)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Owner access required to manage the team. The Team page is read-only
            for advisors and viewers.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2
              className="font-serif"
              style={{ fontSize: 18, lineHeight: "24px", color: "var(--color-text)" }}
            >
              Districts &amp; schools
            </h2>
            <p
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "var(--color-muted)",
              }}
            >
              Provision new districts, register CEEB codes, and import course
              catalogs (D2).
            </p>
            {isAdmin ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/admin/districts/new"
                  className="inline-flex items-center rounded-md px-3.5 py-2 text-[12px] font-semibold text-white"
                  style={{ background: "var(--color-green)" }}
                >
                  Add district
                </Link>
              </div>
            ) : (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "var(--color-muted)",
                }}
              >
                Admin role required to manage districts and schools.
              </p>
            )}
          </Card>

          <Card>
            <h2
              className="font-serif"
              style={{ fontSize: 18, lineHeight: "24px", color: "var(--color-text)" }}
            >
              Advisor account
            </h2>
            <p
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "var(--color-muted)",
              }}
            >
              Currently signed in as
            </p>
            <p
              style={{
                marginTop: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--color-text)",
              }}
            >
              {session?.email ?? session?.userId ?? "—"}
            </p>
            <p
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "var(--color-muted)",
              }}
            >
              Session role: {session?.role ?? "anonymous"}
              {profile ? ` · Team role: ${profile.teamRole}` : ""}
            </p>
          </Card>
        </div>

        <SettingsTeamSection
          canManageTeam={canManageTeam}
          team={team}
          callerAdvisorId={session?.userId ?? null}
        />

        <SettingsThresholdsSection
          canEdit={canManageTeam}
          initialRows={thresholdRows}
        />

        {canManageTeam ? (
          <SettingsDataFeedsSection
            initialStatus={dataFeedStatus}
            defaultStudentId={defaultStudentId}
          />
        ) : null}

        <Card>
          <h2
            className="font-serif"
            style={{ fontSize: 18, lineHeight: "24px", color: "var(--color-text)" }}
          >
            Data source class reference
          </h2>
          <p
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "var(--color-muted)",
            }}
          >
            Operation TTG records the provenance of every grade and signal so you
            know how much weight to give it.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <SourceClass
              label="Class A"
              description="District-of-record official transcript record (SIS export, signed PDF)."
            />
            <SourceClass
              label="Class B"
              description="District-issued classification or course catalog reference (paste-and-parse) or OCR-extracted transcripts."
            />
            <SourceClass
              label="Class C"
              description="Advisor-entered observation or student self-report (provisional)."
            />
            <SourceClass
              label="Class D"
              description="Inferred or imputed values used only for placeholder display."
            />
          </dl>
        </Card>
      </div>
    </QnShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: 20,
        marginTop: 16,
      }}
    >
      {children}
    </section>
  );
}

function SourceClass({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-row-alt)",
        borderRadius: 6,
        padding: 12,
      }}
    >
      <dt
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          marginTop: 4,
          fontSize: 12,
          color: "var(--color-muted)",
        }}
      >
        {description}
      </dd>
    </div>
  );
}

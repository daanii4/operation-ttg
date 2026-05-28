"use client";

/**
 * Sprint 6 / Workstream C-5 — read-only team section on /dashboard/settings.
 *
 * Visible to all roles: shows a read-only list of team members so advisors
 * and viewers can see who's on the team. Owners get a "Manage team" CTA
 * that links to /dashboard/settings/team.
 */

import * as React from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import type { AdvisorRole } from "@prisma/client";
import { Button } from "@/components/ui/qn";

type Member = {
  advisorId: string;
  email: string | null;
  displayName: string | null;
  teamRole: AdvisorRole;
  studentsAssigned: number;
};

type Snapshot = { members: Member[]; invites: Array<{ email: string; role: AdvisorRole }> };

const ROLE_LABEL: Record<AdvisorRole, string> = {
  owner: "Owner",
  advisor: "Advisor",
  viewer: "Viewer",
};

export interface SettingsTeamSectionProps {
  canManageTeam: boolean;
  team: Snapshot | null;
  callerAdvisorId: string | null;
}

export default function SettingsTeamSection({
  canManageTeam,
  team,
  callerAdvisorId,
}: SettingsTeamSectionProps) {
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
      <div className="flex items-baseline justify-between">
        <div>
          <h2
            className="font-serif"
            style={{ fontSize: 18, lineHeight: "24px", color: "var(--color-text)" }}
          >
            Team
          </h2>
          <p style={{ marginTop: 4, fontSize: 12, color: "var(--color-muted)" }}>
            {canManageTeam
              ? "You can manage roles, invites, and student assignments."
              : "Read-only — only owners can manage the team."}
          </p>
        </div>
        {canManageTeam ? (
          <Link href="/dashboard/settings/team">
            <Button variant="primary" icon={Users}>
              Manage team
            </Button>
          </Link>
        ) : null}
      </div>

      {team && team.members.length > 0 ? (
        <ul role="list" className="mt-4 flex flex-col gap-2">
          {team.members.map((m) => (
            <li
              key={m.advisorId}
              className="flex items-center justify-between gap-3 rounded-md"
              style={{
                padding: "10px 12px",
                background: "var(--color-row-alt)",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  {m.displayName ?? "(name pending)"}
                  {m.advisorId === callerAdvisorId ? (
                    <span style={{ fontSize: 11, color: "var(--color-muted)", marginLeft: 6 }}>
                      (you)
                    </span>
                  ) : null}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-muted)" }}>
                  {m.email ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--color-muted)",
                  }}
                >
                  {m.studentsAssigned} student{m.studentsAssigned === 1 ? "" : "s"}
                </span>
                <span
                  className="inline-flex items-center rounded-full"
                  style={{
                    padding: "2px 8px",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  {ROLE_LABEL[m.teamRole]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ marginTop: 12, fontSize: 12, color: "var(--color-muted)" }}>
          You're the only person on this team yet.
        </p>
      )}
    </section>
  );
}

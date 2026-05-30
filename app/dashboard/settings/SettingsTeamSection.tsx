"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Users } from "lucide-react";
import { toast } from "sonner";
import type { AdvisorRole } from "@prisma/client";
import { Button, Input } from "@/components/ui/qn";
import {
  PermissionNotice,
  SettingsCard,
  SettingsSectionHeader,
  TeamRoleBadge,
} from "@/lib/settings/settings-ui";

type Member = {
  advisorId: string;
  email: string | null;
  displayName: string | null;
  teamRole: AdvisorRole;
  studentsAssigned: number;
};

type Snapshot = {
  members: Member[];
  invites: Array<{ email: string; role: AdvisorRole }>;
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
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"advisor" | "viewer">("advisor");
  const [inviting, setInviting] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim());

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid) {
      setInviteError("Enter a valid email address.");
      return;
    }
    setInviteError(null);
    setInviting(true);
    try {
      const res = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Invite failed");
      toast.success(`Invite sent to ${inviteEmail.trim()}`, { duration: 3000 });
      setInviteEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invite failed";
      setInviteError(msg);
    } finally {
      setInviting(false);
    }
  }

  return (
    <SettingsCard>
      <SettingsSectionHeader
        title="Team"
        subtitle="Counselors and administrators"
        action={
          canManageTeam ? (
            <Link href="/dashboard/settings/team">
              <Button variant="gold" icon={Users}>
                Manage team
              </Button>
            </Link>
          ) : null
        }
      />

      {!canManageTeam ? (
        <div className="mt-4">
          <PermissionNotice>
            You can view team members here. Only the program owner can add members or change roles.
          </PermissionNotice>
        </div>
      ) : null}

      {team && team.members.length > 0 ? (
        <ul role="list" className="mt-4 divide-y divide-[var(--border-default)]">
          {team.members.map((m) => (
            <li
              key={m.advisorId}
              className="flex min-h-[48px] flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--olive-100)] font-sans text-[12px] font-semibold text-[var(--olive-800)]"
                  aria-hidden
                >
                  {(m.displayName ?? m.email ?? "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-sans text-[13px] font-semibold text-[var(--text-primary)]">
                    {m.displayName ?? "(name pending)"}
                    {m.advisorId === callerAdvisorId ? (
                      <span className="ml-1 font-normal text-[var(--text-tertiary)]">(you)</span>
                    ) : null}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[var(--text-tertiary)]">
                    {m.email ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-[12px] text-[var(--text-tertiary)]">
                  {m.studentsAssigned} student{m.studentsAssigned === 1 ? "" : "s"}
                </span>
                <TeamRoleBadge role={m.teamRole} />
                {canManageTeam ? (
                  <button
                    type="button"
                    className="rounded p-2 text-[var(--text-tertiary)] hover:bg-[var(--surface-inner)]"
                    aria-label={`Actions for ${m.displayName ?? m.email}`}
                    onClick={() =>
                      toast.message("Use Manage team for role changes and assignments.")
                    }
                  >
                    <MoreHorizontal size={16} />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 font-sans text-[13px] text-[var(--text-tertiary)]" role="status">
          You&apos;re the only member — add your first counselor.
        </p>
      )}

      {canManageTeam ? (
        <form onSubmit={sendInvite} className="mt-5 border-t border-[var(--border-default)] pt-5">
          <p className="font-sans text-[12px] text-[var(--text-tertiary)]">
            We email a temporary password and a link to join your team.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1">
              <span className="font-sans text-[12px] font-medium text-[var(--text-secondary)]">
                Email
              </span>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="counselor@district.org"
                className="min-h-[44px] text-[16px]"
                aria-invalid={inviteError ? true : undefined}
              />
            </label>
            <label className="flex w-full flex-col gap-1 sm:w-40">
              <span className="font-sans text-[12px] font-medium text-[var(--text-secondary)]">
                Role
              </span>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "advisor" | "viewer")}
                className="min-h-[44px] rounded-md border border-[var(--border-default)] bg-white px-3 font-sans text-[16px] text-[var(--text-primary)]"
              >
                <option value="advisor">Advisor</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
            <Button
              type="submit"
              variant="gold"
              loading={inviting}
              loadingLabel="Sending…"
              disabled={!emailValid || inviting}
              className="min-h-[44px] shrink-0"
            >
              Add member
            </Button>
          </div>
          {inviteError ? (
            <p role="alert" className="mt-2 font-sans text-[12px] text-[var(--status-urgent)]">
              {inviteError}
            </p>
          ) : null}
        </form>
      ) : null}
    </SettingsCard>
  );
}

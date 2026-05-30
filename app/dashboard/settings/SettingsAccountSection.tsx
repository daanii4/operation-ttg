"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AdvisorRole } from "@prisma/client";
import { Button } from "@/components/ui/qn";
import { SettingsCard, SettingsSectionHeader, TeamRoleBadge } from "@/lib/settings/settings-ui";

export interface SettingsAccountSectionProps {
  email: string | null;
  teamRole: AdvisorRole | null;
  loading?: boolean;
}

export function SettingsAccountSection({
  email,
  teamRole,
  loading = false,
}: SettingsAccountSectionProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function signOut() {
    if (!window.confirm("Sign out of Operation TTG?")) return;
    setSigningOut(true);
    try {
      await fetch("/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SettingsCard>
      <SettingsSectionHeader title="Account" subtitle="Your signed-in advisor identity" />
      <div className="mt-4 space-y-3">
        <div>
          <p className="font-sans text-[12px] text-[var(--text-tertiary)]">Signed in as</p>
          {loading ? (
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-[var(--surface-inner)]" />
          ) : (
            <p className="mt-0.5 font-mono text-[12px] text-[var(--text-primary)]">
              {email ?? "—"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans text-[12px] text-[var(--text-tertiary)]">Role</span>
          {loading || !teamRole ? (
            <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--surface-inner)]" />
          ) : (
            <TeamRoleBadge role={teamRole} />
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => router.push("/login")}>
            Change password
          </Button>
          <Button
            variant="ghost"
            type="button"
            loading={signingOut}
            loadingLabel="Signing out…"
            onClick={signOut}
            className="hover:text-[var(--status-urgent)]"
          >
            Sign out
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}

export default SettingsAccountSection;

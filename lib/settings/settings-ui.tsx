import * as React from "react";
import type { AdvisorRole } from "@prisma/client";

/** Shared card chrome for Settings modules (Build 06). */
export function SettingsCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-sm)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}

export function SettingsSectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-serif text-[18px] leading-6 text-[var(--text-primary)]">{title}</h2>
        {subtitle ? (
          <p className="mt-1 font-sans text-[12px] leading-4 text-[var(--text-tertiary)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

const ROLE_LABEL: Record<AdvisorRole, string> = {
  owner: "Owner",
  advisor: "Advisor",
  viewer: "Viewer",
};

export function TeamRoleBadge({ role }: { role: AdvisorRole }) {
  const isOwner = role === "owner";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-[11px] font-semibold",
        isOwner
          ? "border-[var(--olive-600)] bg-[var(--olive-100)] text-[var(--olive-800)]"
          : "border-[var(--border-default)] bg-[var(--surface-inner)] text-[var(--text-secondary)]",
      ].join(" ")}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

export function PermissionNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-md border border-[var(--status-support)] bg-[var(--status-support-tint)] px-4 py-3 font-sans text-[13px] leading-5 text-[var(--text-secondary)]"
    >
      {children}
    </div>
  );
}

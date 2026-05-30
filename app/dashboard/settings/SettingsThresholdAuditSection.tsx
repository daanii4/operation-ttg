"use client";

import * as React from "react";
import type { AdvisorRole } from "@prisma/client";
import { SettingsCard, SettingsSectionHeader } from "@/lib/settings/settings-ui";

type AuditRow = {
  id: string;
  thresholdKey: string;
  previousValue: number;
  newValue: number;
  changedBy: string;
  changedAt: string;
  reason: string | null;
};

export function SettingsThresholdAuditSection({ teamRole }: { teamRole: AdvisorRole }) {
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (teamRole !== "owner") {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/settings/threshold-audit", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { data: AuditRow[] };
          setRows(json.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [teamRole]);

  if (teamRole !== "owner") return null;

  return (
    <SettingsCard>
      <SettingsSectionHeader
        title="Threshold change log"
        subtitle="Operator-configurable cutoffs only — NCAA-mandated values are not logged here."
      />
      {loading ? (
        <div className="mt-4 h-24 animate-pulse rounded bg-[var(--surface-inner)]" />
      ) : rows.length === 0 ? (
        <p className="mt-4 font-sans text-[13px] text-[var(--text-tertiary)]" role="status">
          No threshold edits recorded yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
          {rows.map((row) => (
            <li key={row.id} className="py-3 font-sans text-[13px]">
              <p className="font-mono text-[12px] font-semibold text-[var(--text-primary)]">
                {row.thresholdKey}
              </p>
              <p className="mt-1 text-[var(--text-secondary)]">
                {row.previousValue} → {row.newValue} · {row.changedBy}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--text-tertiary)]">
                {new Date(row.changedAt).toLocaleString()}
              </p>
              {row.reason ? (
                <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">{row.reason}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}

export default SettingsThresholdAuditSection;

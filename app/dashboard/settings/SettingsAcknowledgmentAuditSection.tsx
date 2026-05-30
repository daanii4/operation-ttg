"use client";

import * as React from "react";
import { GitBranch, X } from "lucide-react";
import type { AdvisorRole } from "@prisma/client";
import { Button } from "@/components/ui/qn";
import {
  PermissionNotice,
  SettingsCard,
  SettingsSectionHeader,
} from "@/lib/settings/settings-ui";
import { canAccessAcknowledgmentAudit } from "@/lib/settings/acknowledgment-access";

type AuditRow = {
  id: string;
  studentId: string;
  athleteName: string;
  escalationReason: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
  actionTaken: string;
  counselorNotes: string | null;
  reEscalated: boolean;
  conditionsSnapshot: unknown;
};

type Filter = "all" | "this_week" | "unactioned_24h";

export function SettingsAcknowledgmentAuditSection({
  teamRole,
}: {
  teamRole: AdvisorRole;
}) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<AuditRow | null>(null);

  const canAccess = canAccessAcknowledgmentAudit(teamRole);

  const load = React.useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/escalation-acknowledgments?filter=${filter}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as { data: AuditRow[] };
        setRows(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, canAccess]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (!canAccess) {
    return null;
  }

  if (teamRole === "viewer") {
    return (
      <SettingsCard>
        <SettingsSectionHeader
          title="Escalation acknowledgments"
          subtitle="Safety escalation audit trail"
        />
        <div className="mt-4">
          <PermissionNotice>
            Acknowledgment records are visible to the program owner and each student&apos;s assigned
            advisor only.
          </PermissionNotice>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard>
      <SettingsSectionHeader
        title="Escalation acknowledgments"
        subtitle="Every safety escalation and who actioned it"
      />

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter acknowledgments">
        {(
          [
            ["all", "All"],
            ["this_week", "This week"],
            ["unactioned_24h", "Older than 24h"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={[
              "min-h-[36px] rounded-full border px-3 py-1 font-sans text-[12px] font-medium",
              filter === id
                ? "border-[var(--olive-600)] bg-[var(--olive-100)] text-[var(--olive-800)]"
                : "border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-[var(--surface-inner)]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 font-sans text-[13px] text-[var(--text-tertiary)]" role="status">
          {filter === "unactioned_24h"
            ? "Nothing outstanding — no acknowledgments older than 24 hours in your scope."
            : "No escalations on record — nothing has required acknowledgment."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse" role="table">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-inner)]">
                <Th>Athlete</Th>
                <Th>Reason</Th>
                <Th>Acknowledged by</Th>
                <Th>When</Th>
                <Th>Action taken</Th>
                <Th align="right">{""}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border-default)]">
                  <Td>
                    <span className="font-sans text-[13px] font-semibold text-[var(--text-primary)]">
                      {row.athleteName}
                    </span>
                    {row.reEscalated ? (
                      <span className="mt-0.5 flex items-center gap-1 font-sans text-[11px] font-semibold text-[var(--status-escalated)]">
                        <GitBranch size={12} aria-hidden />
                        Re-reviewed
                      </span>
                    ) : null}
                  </Td>
                  <Td>{row.escalationReason}</Td>
                  <Td>{row.acknowledgedBy}</Td>
                  <Td mono>
                    {new Date(row.acknowledgedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Td>
                  <Td>{row.actionTaken}</Td>
                  <Td align="right">
                    <Button variant="ghost" type="button" onClick={() => setDetail(row)}>
                      View
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ack-detail-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start justify-between gap-2">
              <h3 id="ack-detail-title" className="font-serif text-[18px] text-[var(--text-primary)]">
                Acknowledgment detail
              </h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-inner)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <dl className="mt-4 space-y-3 font-sans text-[13px]">
              <div>
                <dt className="text-[12px] text-[var(--text-tertiary)]">Athlete</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{detail.athleteName}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[var(--text-tertiary)]">Escalation reason</dt>
                <dd>{detail.escalationReason}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[var(--text-tertiary)]">Action taken</dt>
                <dd>{detail.actionTaken}</dd>
              </div>
              {detail.counselorNotes ? (
                <div>
                  <dt className="text-[12px] text-[var(--text-tertiary)]">Counselor notes</dt>
                  <dd className="whitespace-pre-wrap">{detail.counselorNotes}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[12px] text-[var(--text-tertiary)]">Conditions at acknowledgment</dt>
                <dd>
                  <pre className="mt-1 max-h-40 overflow-auto rounded bg-[var(--surface-inner)] p-2 font-mono text-[11px]">
                    {JSON.stringify(detail.conditionsSnapshot, null, 2)}
                  </pre>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </SettingsCard>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className="px-3 py-2 text-left font-sans text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
      style={{ textAlign: align ?? "left" }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
  align,
}: {
  children: React.ReactNode;
  mono?: boolean;
  align?: "left" | "right";
}) {
  return (
    <td
      className={[
        "min-h-[48px] px-3 py-2 align-middle font-sans text-[13px] text-[var(--text-secondary)]",
        mono ? "font-mono text-[12px]" : "",
      ].join(" ")}
      style={{ textAlign: align ?? "left" }}
    >
      {children}
    </td>
  );
}

export default SettingsAcknowledgmentAuditSection;

"use client";

import * as React from "react";

export interface EscalationHistoryEntry {
  id: string;
  acknowledgedAt: string;
  advisorName: string;
  actionLabel: string;
  counselorNotes: string | null;
}

export function EscalationHistoryPanel({ studentId }: { studentId: string }) {
  const [entries, setEntries] = React.useState<EscalationHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/students/${studentId}/escalation-history`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data: EscalationHistoryEntry[] };
        if (!cancelled) setEntries(json.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (loading) {
    return (
      <p className="font-sans text-[13px] text-[var(--text-tertiary)]">Loading acknowledgment history…</p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="font-sans text-[13px] text-[var(--text-tertiary)]">
        No documented escalation acknowledgments yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => {
        const date = new Date(entry.acknowledgedAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        const expanded = expandedId === entry.id;
        const notes = entry.counselorNotes ?? "";
        const truncated = notes.length > 120 && !expanded;

        return (
          <li
            key={entry.id}
            className="rounded-md border border-[var(--border-default)] bg-[var(--surface-inner)] px-4 py-3"
          >
            <p className="font-sans text-[13px] font-semibold text-[var(--text-primary)]">{date}</p>
            <p className="mt-0.5 font-sans text-[12px] text-[var(--text-secondary)]">
              {entry.advisorName} · {entry.actionLabel}
            </p>
            {notes ? (
              <p className="mt-2 font-sans text-[13px] text-[var(--text-primary)]">
                {truncated ? `${notes.slice(0, 120)}…` : notes}
              </p>
            ) : null}
            {notes.length > 120 ? (
              <button
                type="button"
                className="mt-1 font-sans text-[12px] font-medium text-[var(--olive-600)] underline"
                onClick={() => setExpandedId(expanded ? null : entry.id)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default EscalationHistoryPanel;

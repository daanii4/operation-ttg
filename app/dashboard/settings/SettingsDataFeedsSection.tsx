"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/qn";
import { SettingsCard, SettingsSectionHeader } from "@/lib/settings/settings-ui";

interface FeedStatus {
  enabled: boolean;
  provider: string;
  providerStatus: string;
  lastIngestion: {
    jobId: string;
    provider: string;
    completedAt: string;
    recordsWritten: number;
  } | null;
}

export interface SettingsDataFeedsSectionProps {
  initialStatus: FeedStatus | null;
  defaultStudentId: string | null;
}

function syncStatus(last: FeedStatus["lastIngestion"]): {
  tone: "track" | "support" | "urgent";
  label: string;
} {
  if (!last) {
    return { tone: "support", label: "Never synced" };
  }
  const ageMs = Date.now() - new Date(last.completedAt).getTime();
  const days = ageMs / (24 * 60 * 60 * 1000);
  if (days > 9) {
    return { tone: "support", label: `Stale — ${Math.round(days)} days` };
  }
  if (days > 2) {
    return { tone: "support", label: `Synced ${Math.round(days)} days ago` };
  }
  const hours = Math.max(1, Math.round(ageMs / (60 * 60 * 1000)));
  return { tone: "track", label: hours < 24 ? `Synced ${hours}h ago` : "Synced recently" };
}

const DOT_CLASS = {
  track: "bg-[var(--status-track)]",
  support: "bg-[var(--status-support)]",
  urgent: "bg-[var(--status-urgent)]",
} as const;

export default function SettingsDataFeedsSection({
  initialStatus,
  defaultStudentId,
}: SettingsDataFeedsSectionProps) {
  const [status, setStatus] = React.useState<FeedStatus | null>(initialStatus);
  const [studentId, setStudentId] = React.useState(defaultStudentId ?? "");
  const [syncing, setSyncing] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/settings/data-feeds", { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { data: FeedStatus };
      setStatus(json.data);
    }
  }, []);

  const runSync = async () => {
    if (!studentId.trim()) {
      toast.error("Enter a student ID to sync");
      return;
    }
    setSyncError(null);
    setSyncing(true);
    try {
      const res = await fetch(
        `/api/students/${encodeURIComponent(studentId.trim())}/ingest-transcript`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? `Sync failed (${res.status})`);
      toast.success("Sync completed", { duration: 3000 });
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      setSyncError(msg);
    } finally {
      setSyncing(false);
    }
  };

  const sync = syncStatus(status?.lastIngestion ?? null);
  const enabled = status?.enabled ?? false;

  return (
    <SettingsCard>
      <SettingsSectionHeader
        title="Data feeds"
        subtitle="Where transcript and grade data comes from"
      />

      {!enabled ? (
        <p className="mt-4 font-sans text-[13px] text-[var(--text-tertiary)]" role="status">
          No data feed connected yet — connect a source to begin. Enable{" "}
          <code className="font-mono text-[12px]">DATA_FEED_ENABLED</code> in deployment config.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-inner)] px-4 py-3">
        <span
          className={["inline-block h-2.5 w-2.5 shrink-0 rounded-full", DOT_CLASS[sync.tone]].join(" ")}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[13px] font-semibold text-[var(--text-primary)]">
            TranscriptAPI · {sync.label}
          </p>
          {status?.lastIngestion ? (
            <p className="font-mono text-[11px] text-[var(--text-tertiary)]">
              {new Date(status.lastIngestion.completedAt).toLocaleString()} ·{" "}
              {status.lastIngestion.recordsWritten} records written
            </p>
          ) : (
            <p className="font-sans text-[12px] text-[var(--text-tertiary)]">
              {status?.providerStatus === "stub-pending-mcp-2"
                ? "Partnership pending (stub)"
                : "Awaiting first successful sync"}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          icon={RefreshCcw}
          loading={syncing}
          loadingLabel="Syncing…"
          disabled={!enabled || syncing}
          onClick={runSync}
          className="min-h-[44px]"
        >
          Sync now
        </Button>
      </div>

      {enabled ? (
        <label className="mt-4 flex flex-col gap-1">
          <span className="font-sans text-[12px] font-medium text-[var(--text-secondary)]">
            Student ID for manual sync
          </span>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="min-h-[44px] rounded-md border border-[var(--border-default)] bg-white px-3 font-mono text-[16px] text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
            placeholder="stu_marcus_001"
          />
        </label>
      ) : null}

      {syncError ? (
        <p role="alert" className="mt-2 font-sans text-[12px] text-[var(--status-urgent)]">
          {syncError}
        </p>
      ) : null}
    </SettingsCard>
  );
}

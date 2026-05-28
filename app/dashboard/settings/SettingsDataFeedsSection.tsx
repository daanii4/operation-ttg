"use client";

/**
 * Sprint 7 / Workstream A-6 — Data Feeds settings section.
 *
 * Owner-only. Shows the runtime status (ENABLED / DISABLED), the configured
 * provider, and the last successful ingestion. The Run ingestion button is
 * disabled when DATA_FEED_ENABLED !== "true" — there is intentionally no UI
 * toggle to enable/disable the pipeline; that requires an env var change to
 * prevent accidental activation.
 */

import * as React from "react";
import { CheckCircle2, Play, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/qn";

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
  /** Optional first student id from the cohort — used as the default Run target. */
  defaultStudentId: string | null;
}

export default function SettingsDataFeedsSection({
  initialStatus,
  defaultStudentId,
}: SettingsDataFeedsSectionProps) {
  const [status, setStatus] = React.useState<FeedStatus | null>(initialStatus);
  const [studentId, setStudentId] = React.useState<string>(
    defaultStudentId ?? ""
  );
  const [running, setRunning] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/settings/data-feeds", { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { data: FeedStatus };
      setStatus(json.data);
    }
  }, []);

  const runIngestion = async () => {
    if (!studentId.trim()) {
      toast.error("Enter a student ID to ingest");
      return;
    }
    setRunning(true);
    try {
      const res = await fetch(
        `/api/students/${encodeURIComponent(studentId.trim())}/ingest-transcript`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => null)) as
        | { error?: string; data?: { recordsWritten: number; status: string } }
        | null;
      if (!res.ok) {
        throw new Error(
          data?.error ??
            `Ingestion failed (${res.status}). Confirm DATA_FEED_ENABLED is set.`
        );
      }
      toast.success(
        `Ingestion ${data?.data?.status ?? "complete"} — ${
          data?.data?.recordsWritten ?? 0
        } record(s) written`
      );
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ingestion failed");
    } finally {
      setRunning(false);
    }
  };

  const enabled = status?.enabled ?? false;

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
      <h2
        className="font-serif"
        style={{ fontSize: 18, lineHeight: "24px", color: "var(--color-text)" }}
      >
        Data feeds
      </h2>
      <p style={{ marginTop: 4, fontSize: 12, color: "var(--color-muted)" }}>
        Class A verified-data-feed ingestion. The flag is controlled via the
        deployment environment only — there is no UI toggle by design.
      </p>

      <div
        className="mt-4 grid gap-3"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}
      >
        <div
          style={{
            padding: 12,
            background: "var(--color-row-alt)",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-muted)",
            }}
          >
            Status
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {enabled ? (
              <CheckCircle2 size={16} aria-hidden style={{ color: "var(--color-green)" }} />
            ) : (
              <ShieldOff size={16} aria-hidden style={{ color: "var(--color-red)" }} />
            )}
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: enabled ? "var(--color-green)" : "var(--color-red)",
              }}
            >
              {enabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
          <p
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "var(--color-muted)",
            }}
          >
            Set <code>DATA_FEED_ENABLED=true</code> in your deployment
            environment to enable. Do not enable without legal review.
          </p>
        </div>
        <div
          style={{
            padding: 12,
            background: "var(--color-row-alt)",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-muted)",
            }}
          >
            Provider
          </div>
          <div
            className="mt-1.5"
            style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}
          >
            TranscriptAPI
          </div>
          <p style={{ marginTop: 6, fontSize: 11, color: "var(--color-muted)" }}>
            {status?.providerStatus === "stub-pending-mcp-2"
              ? "Stub — partnership pending (MCP-2)"
              : status?.providerStatus ?? "Unknown"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-muted)",
            marginBottom: 6,
          }}
        >
          Last ingestion
        </div>
        {status?.lastIngestion ? (
          <p style={{ fontSize: 13, color: "var(--color-text)" }}>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {new Date(status.lastIngestion.completedAt).toLocaleString()}
            </span>
            <span style={{ color: "var(--color-muted)", marginLeft: 8 }}>
              · {status.lastIngestion.recordsWritten} record
              {status.lastIngestion.recordsWritten === 1 ? "" : "s"} written ·
              provider {status.lastIngestion.provider}
            </span>
          </p>
        ) : (
          <p style={{ fontSize: 13, color: "var(--color-muted)" }}>
            No successful ingestion yet.
          </p>
        )}
      </div>

      <div
        className="mt-4 flex flex-wrap items-end gap-2"
        style={{
          padding: 12,
          background: "var(--color-row-alt)",
          borderRadius: 6,
        }}
      >
        <label className="flex flex-col gap-1" style={{ flex: 1, minWidth: 220 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-muted)",
            }}
          >
            Student ID
          </span>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="stu_marcus_001"
            disabled={!enabled}
            className="rounded-md border bg-white"
            style={{
              height: 36,
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: 13,
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              fontFamily: "var(--font-mono)",
            }}
          />
        </label>
        <Button
          variant="primary"
          icon={Play}
          onClick={runIngestion}
          loading={running}
          loadingLabel="Running…"
          disabled={!enabled || running}
        >
          Run ingestion
        </Button>
      </div>
    </section>
  );
}

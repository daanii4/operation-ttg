"use client";

import * as React from "react";

export type PdfJobType = "student_briefing" | "cohort_summary";

export type PdfJobStatus =
  | "idle"
  | "submitting"
  | "queued"
  | "generating"
  | "downloading"
  | "ready"
  | "failed";

export interface UsePdfExportOptions {
  jobType: PdfJobType;
  /** Required for jobType === "student_briefing". */
  studentId?: string;
  /** Polling interval (ms). Defaults to 2000ms per Sprint 5 spec. */
  pollIntervalMs?: number;
}

export interface UsePdfExportApi {
  status: PdfJobStatus;
  isBusy: boolean;
  error: string | null;
  jobId: string | null;
  statusLabel: string;
  start: (opts?: { filenameHint?: string }) => Promise<void>;
  reset: () => void;
}

const POLL_DEFAULT_MS = 2000;

const STATUS_LABELS: Record<PdfJobStatus, string> = {
  idle: "Idle",
  submitting: "Submitting…",
  queued: "Queued…",
  generating: "Generating…",
  downloading: "Downloading…",
  ready: "Ready",
  failed: "Failed",
};

function endpointForType(jobType: PdfJobType): string {
  return jobType === "student_briefing" ? "/api/pdf/student" : "/api/pdf/cohort";
}

function defaultFilename(jobType: PdfJobType): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = jobType === "student_briefing" ? "student-briefing" : "cohort-summary";
  return `${slug}-${date}.pdf`;
}

export function usePdfExport(options: UsePdfExportOptions): UsePdfExportApi {
  const { jobType, studentId, pollIntervalMs = POLL_DEFAULT_MS } = options;

  const [status, setStatus] = React.useState<PdfJobStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [jobId, setJobId] = React.useState<string | null>(null);

  const cancelledRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const reset = React.useCallback(() => {
    setStatus("idle");
    setError(null);
    setJobId(null);
  }, []);

  const start = React.useCallback(
    async (opts?: { filenameHint?: string }) => {
      if (cancelledRef.current) return;
      setStatus("submitting");
      setError(null);

      let acceptedJobId: string | null = null;
      try {
        const body =
          jobType === "student_briefing" ? { student_id: studentId } : {};
        const submitRes = await fetch(endpointForType(jobType), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (submitRes.status === 401) throw new Error("Sign in required to export.");
        if (!submitRes.ok && submitRes.status !== 202) {
          const data = (await submitRes.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(data?.error ?? `PDF request failed (${submitRes.status})`);
        }
        const submitJson = (await submitRes.json()) as { jobId: string };
        acceptedJobId = submitJson.jobId;
        if (!acceptedJobId) throw new Error("PDF service returned no jobId.");
        setJobId(acceptedJobId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Submission failed");
        setStatus("failed");
        return;
      }

      setStatus("queued");

      const poll = async (): Promise<void> => {
        if (cancelledRef.current || !acceptedJobId) return;
        try {
          const res = await fetch(`/api/pdf/${acceptedJobId}/status`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`Status check failed (${res.status})`);
          const data = (await res.json()) as {
            status: "pending" | "generating" | "ready" | "failed";
            error?: string;
          };
          if (data.status === "ready") {
            setStatus("downloading");
            const filename = `${opts?.filenameHint ?? defaultFilename(jobType)}`;
            const downloadRes = await fetch(
              `/api/pdf/${acceptedJobId}/download`
            );
            if (!downloadRes.ok) {
              throw new Error(`Download failed (${downloadRes.status})`);
            }
            const blob = await downloadRes.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setStatus("ready");
            return;
          }
          if (data.status === "failed") {
            setStatus("failed");
            setError(data.error ?? "PDF generation failed");
            return;
          }
          setStatus(data.status === "pending" ? "queued" : "generating");
          setTimeout(poll, pollIntervalMs);
        } catch (e) {
          setStatus("failed");
          setError(e instanceof Error ? e.message : "Polling failed");
        }
      };

      void poll();
    },
    [jobType, studentId, pollIntervalMs]
  );

  const isBusy =
    status === "submitting" ||
    status === "queued" ||
    status === "generating" ||
    status === "downloading";

  return {
    status,
    isBusy,
    error,
    jobId,
    statusLabel: STATUS_LABELS[status],
    start,
    reset,
  };
}

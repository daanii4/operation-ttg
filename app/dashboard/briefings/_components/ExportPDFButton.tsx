"use client";

/**
 * QuasarNova v1 — §4.4 Export PDF button.
 *
 * Outline variant (web hero) or primary (mobile bottom action). Reuses the
 * existing usePdfExport hook so the async lifecycle (submit → poll → blob
 * download) stays in one place.
 *
 * Toast policy (§6.6):
 *   • generating → loading toast (no auto-dismiss).
 *   • ready      → success toast with auto-dismiss 3s.
 *   • failed     → error toast with manual dismiss + retry button.
 */

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonVariant } from "@/components/ui/qn";
import { usePdfExport } from "@/lib/hooks/use-pdf-export";

export interface ExportPDFButtonProps {
  studentId: string;
  studentName: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
  /** Used for the on-disk filename hint. */
  filenameHint?: string;
}

export function ExportPDFButton({
  studentId,
  studentName,
  variant = "gold",
  fullWidth,
  filenameHint,
}: ExportPDFButtonProps) {
  const pdf = usePdfExport({ jobType: "student_briefing", studentId });
  const toastIdRef = React.useRef<string | number | null>(null);

  // React to status transitions to fire the right toast. We only ever surface
  // one toast per export so we tear down the previous one on each step.
  const previousStatus = React.useRef<typeof pdf.status>("idle");
  React.useEffect(() => {
    const prev = previousStatus.current;
    const next = pdf.status;
    previousStatus.current = next;

    if (next === prev) return;

    if (next === "submitting" || next === "queued" || next === "generating") {
      if (toastIdRef.current != null) toast.dismiss(toastIdRef.current);
      toastIdRef.current = toast.loading("Generating briefing PDF…", {
        description: studentName,
      });
      return;
    }

    if (next === "ready") {
      if (toastIdRef.current != null) toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
      toast.success("Briefing PDF ready", {
        description: studentName,
        duration: 3000,
      });
      return;
    }

    if (next === "failed") {
      if (toastIdRef.current != null) toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
      toast.error("Couldn't generate PDF", {
        description: pdf.error ?? "Try again in a moment.",
        action: {
          label: "Retry",
          onClick: () =>
            pdf.start({
              filenameHint: filenameHint ?? `briefing-${studentName}`.toLowerCase(),
            }),
        },
        duration: Infinity,
      });
      return;
    }
  }, [pdf.status, pdf.error, studentName, filenameHint, pdf]);

  return (
    <Button
      variant={variant}
      icon={Download}
      loading={pdf.isBusy}
      loadingLabel="Generating…"
      disabled={pdf.isBusy}
      fullWidth={fullWidth}
      onClick={() =>
        pdf.start({
          filenameHint: filenameHint ?? `briefing-${studentName}`.toLowerCase(),
        })
      }
      // Lock the resting width so the layout doesn't reflow when the spinner
      // replaces the icon (§4.4 acceptance row).
      style={{ minWidth: 140 }}
    >
      Export PDF
    </Button>
  );
}

export default ExportPDFButton;

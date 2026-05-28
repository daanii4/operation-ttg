"use client";

/**
 * QuasarNova v1 — Briefings page client.
 *
 * Owns the selected-student state and routes between desktop (split-pane)
 * and mobile (single-column with prev/next + picker sheet) renders.
 */

import * as React from "react";
import { AlertCircle, AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { Button, EvidenceTierChip, SkeletonCard } from "@/components/ui/qn";
import StudentWorkspaceLayout from "@/components/dashboard/StudentWorkspaceLayout";
import BriefingCard from "./_components/BriefingCard";
import MobileStudentSelector from "./_components/MobileStudentSelector";
import MobileStudentPickerSheet from "./_components/MobileStudentPickerSheet";
import BriefingHero from "./_components/BriefingHero";
import InterventionCodes from "./_components/InterventionCodes";
import LayerSummary from "./_components/LayerSummary";
import ExportPDFButton from "./_components/ExportPDFButton";
import {
  hasInsufficientEvidence,
  selectWorstTier,
  tierToChipBucket,
  useBriefingData,
} from "./_components/use-briefing-data";

export interface BriefingsPageClientProps {
  rows: QnRosterRow[];
}

export default function BriefingsPageClient({ rows }: BriefingsPageClientProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    rows[0]?.studentId ?? null
  );
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const selected = React.useMemo(
    () => rows.find((r) => r.studentId === selectedId) ?? null,
    [rows, selectedId]
  );

  const briefing = useBriefingData(selectedId);

  return (
    <>
      {/* ============================ Desktop ============================ */}
      <StudentWorkspaceLayout
        rows={rows}
        selectedId={selectedId}
        onSelect={setSelectedId}
        listTitle="Briefings"
        listAriaLabel="Students with briefings"
      >
        <BriefingCard selected={selected} briefing={briefing} embedded />
      </StudentWorkspaceLayout>

      {/* ============================ Mobile ============================= */}
      <div className="md:hidden">
        <MobileStudentSelector
          selected={selected}
          rows={rows}
          onSelect={setSelectedId}
          onOpenPicker={() => setPickerOpen(true)}
        />
        <MobileStudentPickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          rows={rows}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <MobileBriefing selected={selected} briefing={briefing} />
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile briefing tree                                                        */
/* -------------------------------------------------------------------------- */

function MobileBriefing({
  selected,
  briefing,
}: {
  selected: QnRosterRow | null;
  briefing: ReturnType<typeof useBriefingData>;
}) {
  if (!selected) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center text-center"
        style={{ padding: 48 }}
      >
        <Inbox size={40} aria-hidden style={{ color: "var(--text-quaternary)" }} />
        <p className="text-base font-semibold" style={{ marginTop: 16, color: "var(--text-primary)" }}>
          Select a student
        </p>
        <p
          style={{
            fontSize: 13,
            lineHeight: "20px",
            marginTop: 4,
            color: "var(--text-tertiary)",
            maxWidth: 320,
          }}
        >
          Tap the name above to choose a student.
        </p>
      </div>
    );
  }

  if (briefing.status === "loading") {
    return (
      <div style={{ padding: 16 }}>
        <SkeletonCard />
      </div>
    );
  }

  if (briefing.status === "error") {
    return <MobileError onRetry={briefing.refetch} message={briefing.error} />;
  }

  if (briefing.status === "empty" || !briefing.data?.f12) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center text-center"
        style={{ padding: 48 }}
      >
        <Inbox size={40} aria-hidden style={{ color: "var(--text-quaternary)" }} />
        <p className="text-base font-semibold" style={{ marginTop: 16, color: "var(--text-primary)" }}>
          No briefing available yet
        </p>
        <p
          style={{
            fontSize: 13,
            lineHeight: "20px",
            marginTop: 4,
            color: "var(--text-tertiary)",
            maxWidth: 320,
          }}
        >
          Eligibility data hasn't compiled for this student. Briefings refresh nightly.
        </p>
      </div>
    );
  }

  const data = briefing.data;
  const insufficient = hasInsufficientEvidence(data);
  const worst = tierToChipBucket(selectWorstTier(data));
  const isEscalated = data.f12!.composite_band === "ESCALATED";

  return (
    <>
      {isEscalated ? (
        <div
          role="status"
          className="flex items-center gap-2"
          style={{
            background: "var(--color-escalated-tint)",
            borderBottom: "1px solid var(--color-escalated)",
            padding: "10px 16px",
          }}
        >
          <AlertTriangle size={16} aria-hidden style={{ color: "var(--color-escalated)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-escalated)" }}>
            ESCALATED — Highest urgency
          </span>
        </div>
      ) : null}

      <div style={{ paddingBottom: 96 /* leave room for sticky export bar */ }}>
        <BriefingHero
          student={selected}
          updatedRelative={
            briefing.computedAt
              ? briefing.computedAt.toLocaleString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : undefined
          }
          bandOverride={data.f12!.composite_band}
          weeksOverride={data.f12!.weeks_to_critical_action}
        />

        {insufficient ? (
          <div
            role="status"
            style={{
              margin: 16,
              padding: "12px 16px",
              background: "var(--color-yellow-tint)",
              border: "1px solid #FDE68A",
              borderRadius: 6,
              fontSize: 12,
              color: "#92400E",
            }}
          >
            Some layers don't have enough recent data. Treat values as provisional.
          </div>
        ) : null}

        <InterventionCodes f12={data.f12!} sectionBorder />
        <LayerSummary payload={data} />

        <div
          className="flex items-center justify-between"
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border-default)",
            background: "var(--surface-inner)",
          }}
        >
          <EvidenceTierChip tier={worst} />
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {briefing.computedAt
              ? briefing.computedAt.toLocaleString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
      </div>

      {/* Sticky bottom export action (mobile). */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
          background: "var(--surface-card)",
          borderTop: "1px solid var(--border-default)",
          zIndex: 25,
        }}
      >
        <ExportPDFButton
          variant="gold"
          fullWidth
          studentId={selected.studentId}
          studentName={selected.fullName}
          filenameHint={`briefing-${selected.firstName}-${selected.lastName}`.toLowerCase()}
        />
      </div>
    </>
  );
}

function MobileError({ onRetry, message }: { onRetry: () => void; message: string | null }) {
  return (
    <div
      role="alert"
      style={{
        margin: 16,
        padding: "12px 16px",
        background: "var(--color-red-tint)",
        borderLeft: "3px solid var(--color-red)",
        borderRadius: 6,
      }}
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={16} aria-hidden style={{ color: "var(--color-red)" }} />
        <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
          Couldn't load briefing
        </p>
      </div>
      <p style={{ fontSize: 12, color: "var(--color-red)", marginTop: 4 }}>
        {message ?? "Check your connection and try again."}
      </p>
      <div style={{ marginTop: 12 }}>
        <Button variant="outline" onClick={onRetry} icon={Loader2}>
          Retry
        </Button>
      </div>
    </div>
  );
}

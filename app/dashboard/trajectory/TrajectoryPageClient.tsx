"use client";

/**
 * Sprint 6 / A4-3 — Trajectory page client.
 *
 * Mirrors the Briefings split-pane: shared 320px student selector on
 * desktop, prev/next + picker sheet on mobile. Right pane stacks three
 * cards (GPA Trajectory · AIMS Signal · Engagement) wired to the F9/F10/F11
 * slices of the eligibility API.
 */

import * as React from "react";
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { Button } from "@/components/ui/qn";
import StudentSelectorPanel from "@/components/dashboard/StudentSelectorPanel";
import MobileStudentSelector from "@/components/dashboard/MobileStudentSelector";
import MobileStudentPickerSheet from "@/components/dashboard/MobileStudentPickerSheet";
import { useBriefingData } from "@/app/dashboard/briefings/_components/use-briefing-data";
import GpaTrajectoryCard from "./_components/GpaTrajectoryCard";
import AimsSignalCard from "./_components/AimsSignalCard";
import EngagementCard from "./_components/EngagementCard";
import RiskForecastCard from "./_components/RiskForecastCard";

export interface TrajectoryPageClientProps {
  rows: QnRosterRow[];
}

export default function TrajectoryPageClient({ rows }: TrajectoryPageClientProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    rows[0]?.studentId ?? null
  );
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const briefing = useBriefingData(selectedId);
  const selected = React.useMemo(
    () => rows.find((r) => r.studentId === selectedId) ?? null,
    [rows, selectedId]
  );

  return (
    <>
      {/* ============================ Desktop ============================ */}
      <div className="hidden md:flex md:items-stretch">
        <StudentSelectorPanel
          rows={rows}
          selectedId={selectedId}
          onSelect={setSelectedId}
          title="Trajectory"
        />
        <div
          className="flex-1"
          style={{
            paddingLeft: 24,
            paddingRight: 32,
            paddingTop: 24,
            paddingBottom: 28,
          }}
        >
          <TrajectoryBody selected={selected} briefing={briefing} />
        </div>
      </div>

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
        <div style={{ padding: 16 }}>
          <TrajectoryBody selected={selected} briefing={briefing} />
        </div>
      </div>
    </>
  );
}

function TrajectoryBody({
  selected,
  briefing,
}: {
  selected: QnRosterRow | null;
  briefing: ReturnType<typeof useBriefingData>;
}) {
  if (!selected) return <NoSelection />;
  if (briefing.status === "loading") return <LoadingTrajectory />;
  if (briefing.status === "error") {
    return <ErrorTrajectory onRetry={briefing.refetch} message={briefing.error} />;
  }
  if (briefing.status === "empty" || !briefing.data) {
    return <NoData />;
  }
  return (
    <div className="flex flex-col gap-4">
      <GpaTrajectoryCard
        f9={briefing.data.f9}
        observations={briefing.data.observations?.grades ?? null}
      />
      <AimsSignalCard f10={briefing.data.f10} />
      <EngagementCard f11={briefing.data.f11} />
      <RiskForecastCard ml={briefing.data.ml} />
    </div>
  );
}

function NoSelection() {
  return (
    <div
      role="status"
      style={{
        textAlign: "center",
        padding: 48,
        color: "var(--color-muted)",
      }}
    >
      <p
        className="text-base font-semibold"
        style={{ color: "var(--color-text)" }}
      >
        Select a student
      </p>
      <p style={{ marginTop: 4, fontSize: 13 }}>
        Choose a student from the list to view their trajectory and signals.
      </p>
    </div>
  );
}

function LoadingTrajectory() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          aria-hidden
          className="qn-skeleton"
          style={{ width: "100%", height: 240, borderRadius: 8 }}
        />
      ))}
    </div>
  );
}

function ErrorTrajectory({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message: string | null;
}) {
  return (
    <div
      role="alert"
      style={{
        padding: "16px 20px",
        background: "var(--color-red-tint)",
        borderLeft: "3px solid var(--color-red)",
        borderRadius: 6,
      }}
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          size={20}
          aria-hidden
          style={{ color: "var(--color-red)" }}
        />
        <div>
          <p
            className="text-base font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            Couldn't load trajectory
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--color-red)",
              marginTop: 2,
            }}
          >
            {message ?? "Check your connection and try again."}
          </p>
          <div style={{ marginTop: 12 }}>
            <Button variant="outline" icon={RefreshCcw} onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoData() {
  return (
    <div
      role="status"
      style={{
        textAlign: "center",
        padding: 48,
        color: "var(--color-muted)",
      }}
    >
      <Loader2
        size={20}
        aria-hidden
        className="animate-spin"
        style={{ color: "var(--color-muted)", marginInline: "auto" }}
      />
      <p className="mt-3 text-base font-semibold" style={{ color: "var(--color-text)" }}>
        No trajectory data yet
      </p>
      <p style={{ marginTop: 4, fontSize: 13 }}>
        Trajectory and AIMS data are populated as new observations land.
      </p>
    </div>
  );
}

"use client";

import * as React from "react";
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { Button } from "@/components/ui/qn";
import StudentWorkspaceLayout from "@/components/dashboard/StudentWorkspaceLayout";
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
      <StudentWorkspaceLayout
        rows={rows}
        selectedId={selectedId}
        onSelect={setSelectedId}
        listTitle="Trajectory"
      >
        <TrajectoryBody selected={selected} briefing={briefing} embedded />
      </StudentWorkspaceLayout>

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
        <div className="px-4 pb-6 pt-4">
          <TrajectoryBody selected={selected} briefing={briefing} />
        </div>
      </div>
    </>
  );
}

function TrajectoryBody({
  selected,
  briefing,
  embedded = false,
}: {
  selected: QnRosterRow | null;
  briefing: ReturnType<typeof useBriefingData>;
  embedded?: boolean;
}) {
  const sectionVariant = embedded ? ("embedded" as const) : ("card" as const);

  if (!selected) return <NoSelection embedded={embedded} />;
  if (briefing.status === "loading") return <LoadingTrajectory embedded={embedded} />;
  if (briefing.status === "error") {
    return <ErrorTrajectory onRetry={briefing.refetch} message={briefing.error} embedded={embedded} />;
  }
  if (briefing.status === "empty" || !briefing.data) {
    return <NoData embedded={embedded} />;
  }

  const sections = (
    <>
      <GpaTrajectoryCard
        variant={sectionVariant}
        f9={briefing.data.f9}
        observations={briefing.data.observations?.grades ?? null}
      />
      <AimsSignalCard variant={sectionVariant} f10={briefing.data.f10} />
      <EngagementCard variant={sectionVariant} f11={briefing.data.f11} />
      <RiskForecastCard variant={sectionVariant} ml={briefing.data.ml} />
    </>
  );

  if (embedded) {
    return <div className="[&>section:last-child]:border-b-0">{sections}</div>;
  }

  return <div className="flex flex-col gap-4">{sections}</div>;
}

function NoSelection({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      role="status"
      className={`text-center text-[var(--text-tertiary)] ${embedded ? "px-6 py-12" : "py-12"}`}
    >
      <p className="font-sans text-base font-semibold text-[var(--text-primary)]">
        Select a student
      </p>
      <p className="mt-1 font-sans text-[13px]">
        Choose a student from the list to view their trajectory and signals.
      </p>
    </div>
  );
}

function LoadingTrajectory({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={embedded ? "space-y-0 px-6 py-6" : "flex flex-col gap-4"}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          aria-hidden
          className="animate-pulse bg-[var(--surface-inner)]"
          style={{
            width: "100%",
            height: embedded ? 180 : 240,
            borderBottom: embedded ? "1px solid var(--border-default)" : undefined,
            borderRadius: embedded ? 0 : "var(--radius-default)",
          }}
        />
      ))}
    </div>
  );
}

function ErrorTrajectory({
  onRetry,
  message,
  embedded = false,
}: {
  onRetry: () => void;
  message: string | null;
  embedded?: boolean;
}) {
  return (
    <div
      role="alert"
      className={embedded ? "mx-6 my-6" : undefined}
      style={{
        padding: "16px 20px",
        background: "var(--color-red-tint)",
        borderLeft: "3px solid var(--color-red)",
        borderRadius: 6,
      }}
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={20} aria-hidden className="text-[var(--color-red)]" />
        <div>
          <p className="font-sans text-base font-semibold text-[var(--text-primary)]">
            Couldn't load trajectory
          </p>
          <p className="mt-0.5 font-sans text-[12px] text-[var(--color-red)]">
            {message ?? "Check your connection and try again."}
          </p>
          <div className="mt-3">
            <Button variant="outline" icon={RefreshCcw} onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoData({ embedded = false }: { embedded?: boolean }) {
  return (
    <div
      role="status"
      className={`text-center text-[var(--text-tertiary)] ${embedded ? "px-6 py-12" : "py-12"}`}
    >
      <Loader2
        size={20}
        aria-hidden
        className="mx-auto animate-spin text-[var(--text-tertiary)]"
      />
      <p className="mt-3 font-sans text-base font-semibold text-[var(--text-primary)]">
        No trajectory data yet
      </p>
      <p className="mt-1 font-sans text-[13px]">
        Trajectory and AIMS data are populated as new observations land.
      </p>
    </div>
  );
}

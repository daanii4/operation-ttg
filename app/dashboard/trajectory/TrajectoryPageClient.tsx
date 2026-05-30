"use client";

/**
 * Trajectory tab — academic trend only (F9 GPA + F5 core completion pace).
 *
 * AIMS and engagement signals live on Briefings and the student profile;
 * they are intentionally excluded here so academic direction stays defensible.
 */

import * as React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { Button } from "@/components/ui/qn";
import StudentWorkspaceLayout from "@/components/dashboard/StudentWorkspaceLayout";
import MobileStudentSelector from "@/components/dashboard/MobileStudentSelector";
import MobileStudentPickerSheet from "@/components/dashboard/MobileStudentPickerSheet";
import { useBriefingData, type BriefingPayload } from "@/app/dashboard/briefings/_components/use-briefing-data";
import GpaTrajectoryCard from "./_components/GpaTrajectoryCard";
import CompletionPaceCard from "./_components/CompletionPaceCard";
import { TrajectoryDirectionPanel } from "./_components/TrajectoryDirectionPanel";

export interface TrajectoryPageClientProps {
  rows: QnRosterRow[];
}

export default function TrajectoryPageClient({ rows }: TrajectoryPageClientProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    rows[0]?.studentId ?? null
  );
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const gpaDrawInPlayed = React.useRef(false);
  const briefing = useBriefingData(selectedId);
  const selected = React.useMemo(
    () => rows.find((r) => r.studentId === selectedId) ?? null,
    [rows, selectedId]
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 pt-6 desktop:px-6">
      <StudentWorkspaceLayout
        rows={rows}
        selectedId={selectedId}
        onSelect={setSelectedId}
        listTitle="Trajectory"
      >
        <div className="p-6">
          <TrajectoryBody
            selected={selected}
            briefing={briefing}
            animateGpaDrawIn={!gpaDrawInPlayed.current}
            gpaDrawInPlayed={gpaDrawInPlayed}
          />
        </div>
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
        <div className="pb-6">
          <TrajectoryBody
            selected={selected}
            briefing={briefing}
            animateGpaDrawIn={false}
            gpaDrawInPlayed={gpaDrawInPlayed}
          />
        </div>
      </div>
    </div>
  );
}

function TrajectoryBody({
  selected,
  briefing,
  animateGpaDrawIn,
  gpaDrawInPlayed,
}: {
  selected: QnRosterRow | null;
  briefing: ReturnType<typeof useBriefingData>;
  animateGpaDrawIn: boolean;
  gpaDrawInPlayed: React.MutableRefObject<boolean>;
}) {
  const [visible, setVisible] = React.useState(true);
  const studentKey = selected?.studentId ?? "none";

  React.useEffect(() => {
    setVisible(false);
    const t = window.setTimeout(() => setVisible(true), 16);
    return () => window.clearTimeout(t);
  }, [studentKey]);

  if (!selected) return <NoSelection />;
  if (briefing.status === "loading") return <LoadingTrajectory />;
  if (briefing.status === "error") {
    return <ErrorTrajectory onRetry={briefing.refetch} message={briefing.error} />;
  }
  if (briefing.status === "empty" || !briefing.data) return <NoData />;

  const data = briefing.data as BriefingPayload;
  const playGpaDrawIn =
    animateGpaDrawIn &&
    !!data.f9 &&
    data.f9.evidence_tier !== "Insufficient";
  if (playGpaDrawIn) gpaDrawInPlayed.current = true;

  return (
    <div
      className="space-y-6 transition-opacity duration-[220ms] ease-[var(--ease-out)] motion-reduce:transition-none"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <header className="border-b border-[color:var(--border-default)] pb-4">
        <h2 className="font-serif text-[22px] text-text-primary">{selected.fullName}</h2>
        <p className="mt-1 font-sans text-[13px] text-text-secondary">
          Grade {selected.grade} · {selected.sport} · Academic trajectory
        </p>
      </header>

      <div className="grid gap-6 desktop:grid-cols-12">
        <div className="desktop:col-span-7">
          <GpaTrajectoryCard
            f9={data.f9}
            observations={data.observations?.grades ?? null}
            animateDrawIn={playGpaDrawIn}
          />
        </div>
        <div className="desktop:col-span-5">
          <CompletionPaceCard
            f5={data.f5 ?? null}
            courses={data.f5Courses ?? null}
            studentId={selected.studentId}
          />
        </div>
        <div className="desktop:col-span-12">
          <TrajectoryDirectionPanel f9={data.f9} />
        </div>
      </div>
    </div>
  );
}

function NoSelection() {
  return (
    <div role="status" className="py-12 text-center">
      <p className="font-sans text-base font-semibold text-text-primary">Select a student</p>
      <p className="mt-1 font-sans text-[13px] text-text-tertiary">
        Choose a student from the list to view GPA and core-completion pace.
      </p>
    </div>
  );
}

function LoadingTrajectory() {
  return (
    <div className="grid gap-6 desktop:grid-cols-12">
      <div className="desktop:col-span-7">
        <GpaTrajectoryCard f9={null} observations={null} />
      </div>
      <div className="desktop:col-span-5">
        <CompletionPaceCard f5={null} courses={null} studentId="" loading />
      </div>
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
      className="rounded-md border-l-[3px] border-[color:var(--status-urgent)] bg-[var(--status-urgent-tint)] px-5 py-4"
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={20} className="text-[color:var(--status-urgent)]" aria-hidden />
        <div>
          <p className="font-sans text-base font-semibold text-text-primary">
            Couldn&apos;t load trajectory
          </p>
          <p className="mt-0.5 font-sans text-[12px] text-[color:var(--status-urgent)]">
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

function NoData() {
  return (
    <div role="status" className="py-12 text-center">
      <p className="font-sans text-base font-semibold text-text-primary">No trajectory data yet</p>
      <p className="mt-1 font-sans text-[13px] text-text-tertiary">
        GPA and core pace populate as grade updates and transcript records arrive.
      </p>
    </div>
  );
}

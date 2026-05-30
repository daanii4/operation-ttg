"use client";

import * as React from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import type { AdvisorRole } from "@prisma/client";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { Button, SkeletonCard } from "@/components/ui/qn";
import StudentWorkspaceLayout from "@/components/dashboard/StudentWorkspaceLayout";
import BriefingCard from "./_components/BriefingCard";
import MobileStudentSelector from "./_components/MobileStudentSelector";
import MobileStudentPickerSheet from "./_components/MobileStudentPickerSheet";
import BriefingDetailContent from "./_components/BriefingDetailContent";
import { useBriefingData } from "./_components/use-briefing-data";

export interface BriefingsPageClientProps {
  rows: QnRosterRow[];
  sessionUserId: string;
  teamRole: AdvisorRole;
}

export default function BriefingsPageClient({
  rows,
  sessionUserId,
  teamRole,
}: BriefingsPageClientProps) {
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
      <StudentWorkspaceLayout
        rows={rows}
        selectedId={selectedId}
        onSelect={setSelectedId}
        listTitle="Briefings"
        listAriaLabel="Students with briefings"
      >
        <BriefingCard
          selected={selected}
          briefing={briefing}
          sessionUserId={sessionUserId}
          teamRole={teamRole}
          embedded
        />
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
        <MobileBriefing
          selected={selected}
          briefing={briefing}
          sessionUserId={sessionUserId}
          teamRole={teamRole}
        />
      </div>
    </>
  );
}

function MobileBriefing({
  selected,
  briefing,
  sessionUserId,
  teamRole,
}: {
  selected: QnRosterRow | null;
  briefing: ReturnType<typeof useBriefingData>;
  sessionUserId: string;
  teamRole: AdvisorRole;
}) {
  if (!selected) {
    return (
      <div role="status" className="flex flex-col items-center px-6 py-12 text-center">
        <Inbox size={40} aria-hidden className="text-[var(--text-quaternary)]" />
        <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">Select a student</p>
        <p className="mt-1 max-w-[320px] text-[13px] text-[var(--text-tertiary)]">
          Tap the name above to choose a student.
        </p>
      </div>
    );
  }

  if (briefing.status === "loading") {
    return (
      <div className="p-4">
        <SkeletonCard />
      </div>
    );
  }

  if (briefing.status === "error") {
    return <MobileError onRetry={briefing.refetch} message={briefing.error} />;
  }

  if (briefing.status === "empty" || !briefing.data?.f12) {
    return (
      <div role="status" className="flex flex-col items-center px-6 py-12 text-center">
        <Inbox size={40} aria-hidden className="text-[var(--text-quaternary)]" />
        <p className="mt-4 text-base font-semibold text-[var(--text-primary)]">
          No briefing available yet
        </p>
        <p className="mt-1 max-w-[320px] text-[13px] text-[var(--text-tertiary)]">
          Eligibility data hasn&apos;t compiled for this student. Briefings refresh nightly.
        </p>
      </div>
    );
  }

  return (
    <BriefingDetailContent
      selected={selected}
      briefing={briefing}
      sessionUserId={sessionUserId}
      teamRole={teamRole}
    />
  );
}

function MobileError({ onRetry, message }: { onRetry: () => void; message: string | null }) {
  return (
    <div
      role="alert"
      className="m-4 rounded-md border-l-[3px] border-l-[var(--color-red)] bg-[var(--color-red-tint)] px-4 py-3"
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={16} aria-hidden className="text-[var(--color-red)]" />
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Couldn&apos;t load briefing</p>
      </div>
      <p className="mt-1 text-[12px] text-[var(--color-red)]">
        {message ?? "Check your connection and try again."}
      </p>
      <div className="mt-3">
        <Button variant="outline" onClick={onRetry} icon={Loader2}>
          Retry
        </Button>
      </div>
    </div>
  );
}

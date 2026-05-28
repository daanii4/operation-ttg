"use client";

/**
 * Sprint 6 / A4-3 — Eligibility page client.
 *
 * Layout:
 *   • Desktop: 320px student selector left + two side-by-side cards (A-G,
 *     NCAA D1/D2) + GPA qualifier row spanning both columns.
 *   • Mobile: stacked — A-G first, NCAA next, GPA row last.
 *
 * NCAA card splits into D1 + D2 sub-sections when the student declares both
 * intents. The student's targetDivision drives which sub-sections appear.
 */

import * as React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/qn";
import StudentSelectorPanel from "@/components/dashboard/StudentSelectorPanel";
import MobileStudentSelector from "@/components/dashboard/MobileStudentSelector";
import MobileStudentPickerSheet from "@/components/dashboard/MobileStudentPickerSheet";
import { useBriefingData } from "@/app/dashboard/briefings/_components/use-briefing-data";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import CompletionCard from "./_components/CompletionCard";
import GpaQualifierRow from "./_components/GpaQualifierRow";
import {
  agRowsFromF1,
  ncaaRowsFromF3,
  ncaaRowsFromF6,
} from "./_components/eligibility-rows";

export interface EligibilityPageClientProps {
  rows: QnRosterRow[];
}

function divisionsFor(target: string): { d1: boolean; d2: boolean } {
  switch (target) {
    case "DI":
      return { d1: true, d2: false };
    case "DII":
      return { d1: false, d2: true };
    case "DI_or_DII_undecided":
      return { d1: true, d2: true };
    default:
      return { d1: true, d2: false };
  }
}

export default function EligibilityPageClient({ rows }: EligibilityPageClientProps) {
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
          title="Eligibility"
          hideBand
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
          <EligibilityBody selected={selected} briefing={briefing} desktop />
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
          <EligibilityBody selected={selected} briefing={briefing} desktop={false} />
        </div>
      </div>
    </>
  );
}

function EligibilityBody({
  selected,
  briefing,
  desktop,
}: {
  selected: QnRosterRow | null;
  briefing: ReturnType<typeof useBriefingData>;
  desktop: boolean;
}) {
  if (!selected) return <NoSelection />;
  if (briefing.status === "loading") return <Loading desktop={desktop} />;
  if (briefing.status === "error") {
    return <ErrorState onRetry={briefing.refetch} message={briefing.error} />;
  }
  if (briefing.status === "empty" || !briefing.data) return <NoData />;

  const data = briefing.data;
  const divisions = divisionsFor(selected.targetDivision);
  const f4 = data.f8 ? null : null; // f4 is on bundle, not f8 — pulled below
  void f4;

  // The bundle from build-student-briefing.ts contains f1..f7. We never
  // persist that on the BriefingPayload type, but the eligibility API
  // returns it directly via `...record.bundle`. Cast to read it without
  // bloating the BriefingPayload shape.
  const bundle = data as unknown as {
    f1?: import("@/lib/calculations/f1").F1Result;
    f3?: import("@/lib/calculations/f3").F3Result;
    f4?: import("@/lib/calculations/f4").F4Result;
    f6?: import("@/lib/calculations/f6").F6Result;
    f7?: import("@/lib/calculations/f7").F7Result;
  };

  const agRows = agRowsFromF1(bundle.f1 ?? null);
  const d1Rows = ncaaRowsFromF3(bundle.f3 ?? null);
  const d2Rows = ncaaRowsFromF6(bundle.f6 ?? null);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={
          desktop
            ? "grid items-start gap-4 md:grid-cols-2"
            : "flex flex-col gap-4"
        }
      >
        <CompletionCard
          title="California A-G"
          subtitle="UC / CSU subject area completion"
          rows={agRows}
          source="F1"
        />
        <NcaaSection
          d1Rows={divisions.d1 ? d1Rows : []}
          d2Rows={divisions.d2 ? d2Rows : []}
        />
      </div>
      <GpaQualifierRow
        f4={bundle.f4}
        f7={bundle.f7}
        showD1={divisions.d1}
        showD2={divisions.d2}
      />
    </div>
  );
}

function NcaaSection({
  d1Rows,
  d2Rows,
}: {
  d1Rows: ReturnType<typeof ncaaRowsFromF3>;
  d2Rows: ReturnType<typeof ncaaRowsFromF6>;
}) {
  if (d1Rows.length === 0 && d2Rows.length === 0) {
    return (
      <CompletionCard
        title="NCAA Core"
        subtitle="No NCAA division intent recorded"
        rows={[]}
        source="F3 · F6"
      />
    );
  }
  if (d1Rows.length > 0 && d2Rows.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <CompletionCard
          title="NCAA D1 Core"
          subtitle="Division I core course completion"
          rows={d1Rows}
          source="F3"
        />
        <CompletionCard
          title="NCAA D2 Core"
          subtitle="Division II core course completion"
          rows={d2Rows}
          source="F6"
        />
      </div>
    );
  }
  if (d1Rows.length > 0) {
    return (
      <CompletionCard
        title="NCAA D1 Core"
        subtitle="Division I core course completion"
        rows={d1Rows}
        source="F3"
      />
    );
  }
  return (
    <CompletionCard
      title="NCAA D2 Core"
      subtitle="Division II core course completion"
      rows={d2Rows}
      source="F6"
    />
  );
}

function Loading({ desktop }: { desktop: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className={
          desktop ? "grid items-start gap-4 md:grid-cols-2" : "flex flex-col gap-4"
        }
      >
        <div className="qn-skeleton" style={{ width: "100%", height: 320, borderRadius: 8 }} />
        <div className="qn-skeleton" style={{ width: "100%", height: 320, borderRadius: 8 }} />
      </div>
      <div className="qn-skeleton" style={{ width: "100%", height: 140, borderRadius: 8 }} />
    </div>
  );
}

function ErrorState({
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
        <AlertCircle size={20} aria-hidden style={{ color: "var(--color-red)" }} />
        <div>
          <p
            className="text-base font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            Couldn't load eligibility
          </p>
          <p style={{ fontSize: 12, color: "var(--color-red)", marginTop: 2 }}>
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
        Choose a student from the list to view their eligibility detail.
      </p>
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
      <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
        No eligibility data yet
      </p>
      <p style={{ marginTop: 4, fontSize: 13 }}>
        Eligibility data is populated as transcript records arrive.
      </p>
    </div>
  );
}

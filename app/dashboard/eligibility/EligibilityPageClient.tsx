"use client";

/**
 * Eligibility tab — academic frameworks only (A-G, NCAA D1/D2, Core GPA).
 *
 * Scope decision (owner-confirmed): AIMS / mental-health signals intentionally
 * live on the student profile (Trajectory), briefing layer summary, and roster
 * holistic roll-up — NOT on this defensible-academics surface shown to districts.
 */

import * as React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import Badge, { type BandKey } from "@/components/ui/Badge";
import { Button } from "@/components/ui/qn";
import StudentWorkspaceLayout from "@/components/dashboard/StudentWorkspaceLayout";
import MobileStudentSelector from "@/components/dashboard/MobileStudentSelector";
import MobileStudentPickerSheet from "@/components/dashboard/MobileStudentPickerSheet";
import EvidenceFootnote from "@/components/ttg/EvidenceFootnote";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";
import { useBriefingData } from "@/app/dashboard/briefings/_components/use-briefing-data";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { NCAA_BYLAW_14_3 } from "@/lib/config/ncaa-authority";
import {
  frameworkVerdictFromF1,
  frameworkVerdictFromF3,
  frameworkVerdictFromF6,
} from "@/lib/eligibility/framework-verdict";
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

const HOLISTIC_TO_RISK: Record<QnRosterRow["band"], keyof typeof RISK_VOCABULARY> = {
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
  ESCALATED: "ESCALATED",
};

const HOLISTIC_BAND_KEY: Record<QnRosterRow["band"], BandKey> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  ESCALATED: "escalation",
};

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
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 desktop:px-6">
      {/* Desktop */}
      <StudentWorkspaceLayout
        rows={rows}
        selectedId={selectedId}
        onSelect={setSelectedId}
        listTitle="Eligibility"
        hideBand
      >
        <div className="p-6">
          <EligibilityBody
            selected={selected}
            briefing={briefing}
            desktop
          />
        </div>
      </StudentWorkspaceLayout>

      {/* Mobile */}
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
          <EligibilityBody selected={selected} briefing={briefing} desktop={false} />
        </div>
      </div>
    </div>
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
  const [contentVisible, setContentVisible] = React.useState(true);
  const studentKey = selected?.studentId ?? "none";

  React.useEffect(() => {
    setContentVisible(false);
    const t = window.setTimeout(() => setContentVisible(true), 16);
    return () => window.clearTimeout(t);
  }, [studentKey]);

  if (!selected) return <NoSelection />;

  return (
    <div
      className="flex flex-col gap-6 transition-opacity duration-[220ms] ease-[var(--ease-out)] motion-reduce:transition-none"
      style={{ opacity: contentVisible ? 1 : 0 }}
      key={studentKey}
    >
      <AthleteHeader student={selected} />

      {briefing.status === "loading" ? (
        <Loading desktop={desktop} />
      ) : briefing.status === "error" ? (
        <ErrorState onRetry={briefing.refetch} message={briefing.error} />
      ) : briefing.status === "empty" || !briefing.data ? (
        <NoData />
      ) : (
        <EligibilityFrameworks
          selected={selected}
          bundle={briefing.data as EligibilityBundle}
          desktop={desktop}
        />
      )}

      <EvidenceFootnote
        text="All calculations trace to NCAA Bylaw 14.3 or published school calendar assumptions. No ML, no causal inference."
        sourceUrl={NCAA_BYLAW_14_3.sourceUrl}
        sourceLabel={NCAA_BYLAW_14_3.sourceLabel}
      />
    </div>
  );
}

type EligibilityBundle = {
  f1?: import("@/lib/calculations/f1").F1Result;
  f3?: import("@/lib/calculations/f3").F3Result;
  f4?: import("@/lib/calculations/f4").F4Result;
  f6?: import("@/lib/calculations/f6").F6Result;
  f7?: import("@/lib/calculations/f7").F7Result;
};

function AthleteHeader({ student }: { student: QnRosterRow }) {
  const riskKey = HOLISTIC_TO_RISK[student.band];
  const vocab = RISK_VOCABULARY[riskKey];

  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--border-default)] pb-4">
      <div>
        <h2 className="font-serif text-[22px] leading-tight text-text-primary">
          {student.fullName}
        </h2>
        <p className="mt-1 font-sans text-[13px] text-text-secondary">
          Grade {student.grade} · {student.sport} · {student.targetDivision.replace(/_/g, " ")}
        </p>
      </div>
      <Badge band={HOLISTIC_BAND_KEY[student.band]} size="md" icon={vocab.icon}>
        {vocab.label}
      </Badge>
    </header>
  );
}

function EligibilityFrameworks({
  selected,
  bundle,
  desktop,
}: {
  selected: QnRosterRow;
  bundle: EligibilityBundle;
  desktop: boolean;
}) {
  const divisions = divisionsFor(selected.targetDivision);
  const agVerdict = frameworkVerdictFromF1(bundle.f1);
  const d1Verdict = frameworkVerdictFromF3(bundle.f3);
  const d2Verdict = frameworkVerdictFromF6(bundle.f6);

  return (
    <>
      <div
        className={
          desktop
            ? "grid items-start gap-6 lg:grid-cols-2"
            : "flex flex-col gap-6"
        }
      >
        <CompletionCard
          title="California A-G"
          subtitle="UC / CSU subject completion"
          rows={agRowsFromF1(bundle.f1)}
          verdict={agVerdict}
        />
        <NcaaCards
          divisions={divisions}
          d1Rows={ncaaRowsFromF3(bundle.f3)}
          d2Rows={ncaaRowsFromF6(bundle.f6)}
          d1Verdict={d1Verdict}
          d2Verdict={d2Verdict}
          stacked={!desktop}
        />
      </div>
      <GpaQualifierRow
        f4={bundle.f4}
        f7={bundle.f7}
        showD1={divisions.d1}
        showD2={divisions.d2}
      />
    </>
  );
}

function NcaaCards({
  divisions,
  d1Rows,
  d2Rows,
  d1Verdict,
  d2Verdict,
  stacked,
}: {
  divisions: { d1: boolean; d2: boolean };
  d1Rows: ReturnType<typeof ncaaRowsFromF3>;
  d2Rows: ReturnType<typeof ncaaRowsFromF6>;
  d1Verdict: ReturnType<typeof frameworkVerdictFromF3>;
  d2Verdict: ReturnType<typeof frameworkVerdictFromF6>;
  stacked: boolean;
}) {
  const gap = stacked ? "flex flex-col gap-6" : "flex flex-col gap-6";

  if (!divisions.d1 && !divisions.d2) {
    return (
      <CompletionCard
        title="NCAA Core"
        subtitle="No NCAA division intent recorded"
        rows={[]}
        verdict={{
          band: null,
          notApplicable: true,
          insufficient: false,
          provisional: false,
          provisionalReason: null,
          chipTier: "Insufficient",
          source: NCAA_BYLAW_14_3,
          verdictTitle: "NCAA core completion",
          verdictBody: "No NCAA division intent is recorded for this athlete.",
        }}
      />
    );
  }

  if (divisions.d1 && divisions.d2) {
    return (
      <div className={gap}>
        <CompletionCard
          title="NCAA D1 Core"
          subtitle="Division I core course completion"
          rows={d1Rows}
          verdict={d1Verdict}
        />
        <CompletionCard
          title="NCAA D2 Core"
          subtitle="Division II core course completion"
          rows={d2Rows}
          verdict={d2Verdict}
        />
      </div>
    );
  }

  if (divisions.d1) {
    return (
      <CompletionCard
        title="NCAA D1 Core"
        subtitle="Division I core course completion"
        rows={d1Rows}
        verdict={d1Verdict}
      />
    );
  }

  return (
    <CompletionCard
      title="NCAA D2 Core"
      subtitle="Division II core course completion"
      rows={d2Rows}
      verdict={d2Verdict}
    />
  );
}

function Loading({ desktop }: { desktop: boolean }) {
  return (
    <div className={desktop ? "grid gap-6 lg:grid-cols-2" : "flex flex-col gap-6"}>
      <CompletionCard
        title=""
        rows={[]}
        verdict={null}
        loading
      />
      <CompletionCard
        title=""
        rows={[]}
        verdict={null}
        loading
      />
      <div className={desktop ? "lg:col-span-2" : ""}>
        <GpaQualifierRow loading />
      </div>
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
      className="rounded-md border-l-[3px] border-[color:var(--color-red)] bg-[var(--color-red-tint)] px-5 py-4"
    >
      <div className="flex items-start gap-2">
        <AlertCircle size={20} aria-hidden className="text-[color:var(--color-red)]" />
        <div>
          <p className="text-base font-semibold text-text-primary">
            Couldn&apos;t load eligibility
          </p>
          <p className="mt-0.5 text-[12px] text-[color:var(--color-red)]">
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

function NoSelection() {
  return (
    <div role="status" className="py-12 text-center">
      <p className="text-base font-semibold text-text-primary">Select a student</p>
      <p className="mt-1 text-[13px] text-text-tertiary">
        Choose a student from the list to view their eligibility detail.
      </p>
    </div>
  );
}

function NoData() {
  return (
    <div role="status" className="py-12 text-center">
      <p className="text-base font-semibold text-text-primary">No eligibility data yet</p>
      <p className="mt-1 text-[13px] text-text-tertiary">
        Eligibility data is populated as transcript records arrive.
      </p>
    </div>
  );
}

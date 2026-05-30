"use client";

import CompletionCard from "@/app/dashboard/eligibility/_components/CompletionCard";
import GpaQualifierRow from "@/app/dashboard/eligibility/_components/GpaQualifierRow";
import {
  agRowsFromF1,
  ncaaRowsFromF3,
  ncaaRowsFromF6,
} from "@/app/dashboard/eligibility/_components/eligibility-rows";
import type { ProfileEligibilityPayload, ProfileStudent } from "../profile-types";

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

export function ProfileEligibilityTab({
  student,
  eligibility,
}: {
  student: ProfileStudent;
  eligibility: ProfileEligibilityPayload | null;
}) {
  if (!eligibility) {
    return (
      <p className="py-12 text-center font-sans text-[13px] text-[var(--text-tertiary)]">
        No eligibility data yet.
      </p>
    );
  }

  const divisions = divisionsFor(student.targetDivision);
  const agRows = agRowsFromF1(eligibility.f1 ?? null);
  const d1Rows = ncaaRowsFromF3(eligibility.f3 ?? null);
  const d2Rows = ncaaRowsFromF6(eligibility.f6 ?? null);

  return (
  <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
    <div className="grid md:grid-cols-2 md:divide-x md:divide-[var(--border-default)]">
      <CompletionCard
        variant="embeddedCell"
        title="California A-G"
        subtitle="UC / CSU subject area completion"
        rows={agRows}
        source="F1"
      />
      <NcaaSection d1Rows={divisions.d1 ? d1Rows : []} d2Rows={divisions.d2 ? d2Rows : []} />
    </div>
    <div className="border-t border-[var(--border-default)]">
      <GpaQualifierRow
        variant="embeddedCell"
        f4={eligibility.f4}
        f7={eligibility.f7}
        showD1={divisions.d1}
        showD2={divisions.d2}
      />
    </div>
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
        variant="embeddedCell"
        title="NCAA Core"
        subtitle="No NCAA division intent recorded"
        rows={[]}
        source="F3 · F6"
      />
    );
  }
  if (d1Rows.length > 0 && d2Rows.length > 0) {
    return (
      <div className="flex flex-col divide-y divide-[var(--border-default)]">
        <CompletionCard
          variant="embeddedCell"
          title="NCAA D1 Core"
          subtitle="Division I core course completion"
          rows={d1Rows}
          source="F3"
        />
        <CompletionCard
          variant="embeddedCell"
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
        variant="embeddedCell"
        title="NCAA D1 Core"
        subtitle="Division I core course completion"
        rows={d1Rows}
        source="F3"
      />
    );
  }
  return (
    <CompletionCard
      variant="embeddedCell"
      title="NCAA D2 Core"
      subtitle="Division II core course completion"
      rows={d2Rows}
      source="F6"
    />
  );
}

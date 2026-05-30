"use client";

import CompletionCard from "@/app/dashboard/eligibility/_components/CompletionCard";
import GpaQualifierRow from "@/app/dashboard/eligibility/_components/GpaQualifierRow";
import {
  agRowsFromF1,
  ncaaRowsFromF3,
  ncaaRowsFromF6,
} from "@/app/dashboard/eligibility/_components/eligibility-rows";
import {
  frameworkVerdictFromF1,
  frameworkVerdictFromF3,
  frameworkVerdictFromF6,
} from "@/lib/eligibility/framework-verdict";
import { NCAA_BYLAW_14_3 } from "@/lib/config/ncaa-authority";
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
          embedded
          title="California A-G"
          subtitle="UC / CSU subject area completion"
          rows={agRows}
          verdict={frameworkVerdictFromF1(eligibility.f1)}
        />
        <NcaaSection
          divisions={divisions}
          d1Rows={d1Rows}
          d2Rows={d2Rows}
          f3={eligibility.f3}
          f6={eligibility.f6}
        />
      </div>
      <div className="border-t border-[var(--border-default)]">
        <GpaQualifierRow
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
  divisions,
  d1Rows,
  d2Rows,
  f3,
  f6,
}: {
  divisions: { d1: boolean; d2: boolean };
  d1Rows: ReturnType<typeof ncaaRowsFromF3>;
  d2Rows: ReturnType<typeof ncaaRowsFromF6>;
  f3: ProfileEligibilityPayload["f3"];
  f6: ProfileEligibilityPayload["f6"];
}) {
  const d1Verdict = frameworkVerdictFromF3(f3);
  const d2Verdict = frameworkVerdictFromF6(f6);

  if (!divisions.d1 && !divisions.d2) {
    return (
      <CompletionCard
        embedded
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
      <div className="flex flex-col divide-y divide-[var(--border-default)]">
        <CompletionCard
          embedded
          title="NCAA D1 Core"
          subtitle="Division I core course completion"
          rows={d1Rows}
          verdict={d1Verdict}
        />
        <CompletionCard
          embedded
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
        embedded
        title="NCAA D1 Core"
        subtitle="Division I core course completion"
        rows={d1Rows}
        verdict={d1Verdict}
      />
    );
  }
  return (
    <CompletionCard
      embedded
      title="NCAA D2 Core"
      subtitle="Division II core course completion"
      rows={d2Rows}
      verdict={d2Verdict}
    />
  );
}

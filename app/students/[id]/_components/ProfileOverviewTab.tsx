"use client";

import { EvidenceTierChip } from "@/components/ui/qn";
import { SafetyEscalationBanner } from "@/components/alerts/SafetyEscalationBanner";
import { InterventionCodes } from "@/app/dashboard/briefings/_components/InterventionCodes";
import { LayerSummary } from "@/app/dashboard/briefings/_components/LayerSummary";
import type { AdvisorRole } from "@prisma/client";
import type { ProfileEligibilityPayload } from "../profile-types";
import { EscalationHistoryPanel } from "./EscalationHistoryPanel";

export function ProfileOverviewTab({
  studentId,
  eligibility,
  sessionUserId,
  teamRole,
  assignedAdvisorId,
  onEligibilityRefresh,
}: {
  studentId: string;
  eligibility: ProfileEligibilityPayload | null;
  sessionUserId: string;
  teamRole: AdvisorRole;
  assignedAdvisorId: string | null;
  onEligibilityRefresh: () => void;
}) {
  if (!eligibility?.f12) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <EvidenceTierChip tier="Insufficient" />
        <p className="max-w-md font-sans text-[13px] text-[var(--text-tertiary)]">
          Eligibility data unavailable — check back after sessions are logged.
        </p>
      </div>
    );
  }

  const f12 = eligibility.f12;
  const f8 = eligibility.f8;
  const conditionsSnapshot = {
    f1: eligibility.f1,
    f3: eligibility.f3,
    f4: eligibility.f4,
    f6: eligibility.f6,
    f7: eligibility.f7,
    f8: eligibility.f8,
    f12: eligibility.f12,
  };

  const showSafety =
    f8 &&
    (f8.escalation_required ||
      f8.acknowledgment_state === "acknowledged" ||
      f8.acknowledgment_state === "re_escalated");

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
      {showSafety ? (
        <SafetyEscalationBanner
          studentId={studentId}
          f8={f8}
          sessionUserId={sessionUserId}
          teamRole={teamRole}
          assignedAdvisorId={assignedAdvisorId ?? eligibility.meta?.advisorId ?? null}
          latestAcknowledgment={eligibility.meta?.latestAcknowledgment ?? null}
          conditionsSnapshot={conditionsSnapshot}
          onAcknowledged={onEligibilityRefresh}
        />
      ) : null}

      <div className="border-b border-[var(--border-default)] px-5 py-4">
        <h3 className="font-serif text-[18px] text-[var(--text-primary)]">Intelligence summary</h3>
      </div>

      <InterventionCodes f12={f12} sectionBorder />
      <LayerSummary payload={eligibility} />

      <section
        id="escalation-history"
        className="border-t border-[var(--border-default)] px-5 py-4"
      >
        <h3 className="font-serif text-[16px] text-[var(--text-primary)]">
          Escalation acknowledgment history
        </h3>
        <div className="mt-3">
          <EscalationHistoryPanel studentId={studentId} />
        </div>
      </section>
    </div>
  );
}

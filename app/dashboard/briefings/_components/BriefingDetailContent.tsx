"use client";

import * as React from "react";
import type { AdvisorRole } from "@prisma/client";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { EligibilityEscalationBand } from "@/components/alerts/EligibilityEscalationBand";
import { SafetyEscalationBanner } from "@/components/alerts/SafetyEscalationBanner";
import BriefingHero from "./BriefingHero";
import InterventionCodes from "./InterventionCodes";
import LayerSummary from "./LayerSummary";
import EvidenceFooter from "./EvidenceFooter";
import InsufficientEvidenceNotice from "./InsufficientEvidenceNotice";
import ExportBar from "./ExportBar";
import {
  hasInsufficientEvidence,
  type BriefingPayload,
  type UseBriefingResult,
} from "./use-briefing-data";

export interface BriefingDetailContentProps {
  selected: QnRosterRow;
  briefing: UseBriefingResult;
  sessionUserId: string;
  teamRole: AdvisorRole;
  embedded?: boolean;
}

function showSafetyBanner(payload: BriefingPayload): boolean {
  const f8 = payload.f8;
  if (!f8) return false;
  return (
    f8.escalation_required === true ||
    f8.acknowledgment_state === "acknowledged" ||
    f8.acknowledgment_state === "re_escalated"
  );
}

function showEligibilityBand(payload: BriefingPayload): boolean {
  const f8 = payload.f8;
  const f12 = payload.f12;
  if (!f12 || f12.composite_band !== "ESCALATED") return false;
  if (f8?.escalation_required === true) return false;
  if (f8?.acknowledgment_state === "re_escalated") return false;
  return true;
}

export function BriefingDetailContent({
  selected,
  briefing,
  sessionUserId,
  teamRole,
  embedded = false,
}: BriefingDetailContentProps) {
  const data = briefing.data!;
  const f12 = data.f12!;
  const insufficient = hasInsufficientEvidence(data);
  const updatedRelative = briefing.computedAt
    ? formatRelative(briefing.computedAt)
    : undefined;

  const conditionsSnapshot = React.useMemo(
    () => ({
      f1: data.f1,
      f3: data.f3,
      f4: data.f4,
      f6: data.f6,
      f7: data.f7,
      f8: data.f8,
      f12: data.f12,
    }),
    [data]
  );

  return (
    <>
      {showSafetyBanner(data) && data.f8 ? (
        <SafetyEscalationBanner
          studentId={selected.studentId}
          f8={data.f8}
          sessionUserId={sessionUserId}
          teamRole={teamRole}
          assignedAdvisorId={data.meta?.advisorId ?? null}
          latestAcknowledgment={data.meta?.latestAcknowledgment ?? null}
          conditionsSnapshot={conditionsSnapshot}
          onAcknowledged={() => briefing.refetch()}
        />
      ) : null}

      {showEligibilityBand(data) ? (
        <EligibilityEscalationBand weeksToCriticalAction={f12.weeks_to_critical_action} />
      ) : null}

      <div className="pb-24">
        <BriefingHero
          student={selected}
          f12={f12}
          f8={data.f8}
          updatedRelative={updatedRelative}
          embedded={embedded}
        />

        {insufficient ? <InsufficientEvidenceNotice /> : null}

        <div className="mx-auto max-w-[960px]">
          <InterventionCodes f12={f12} sectionBorder />
          <LayerSummary payload={data} />
          <EvidenceFooter payload={data} computedAt={briefing.computedAt} />
        </div>
      </div>

      <ExportBar
        studentId={selected.studentId}
        studentName={selected.fullName}
        filenameHint={`briefing-${selected.firstName}-${selected.lastName}`.toLowerCase()}
      />
    </>
  );
}

function formatRelative(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(1, Math.round(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

export default BriefingDetailContent;

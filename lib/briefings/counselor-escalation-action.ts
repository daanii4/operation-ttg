import type { CounselorEscalationAction } from "@prisma/client";

export const COUNSELOR_ESCALATION_ACTIONS = [
  "ADVISOR_CONTACT_MADE",
  "PARENT_GUARDIAN_NOTIFIED",
  "DISTRICT_REFERRAL",
  "PATHWAY_PIVOT_INITIATED",
  "WATCHLIST_ONLY",
] as const satisfies readonly CounselorEscalationAction[];

export const COUNSELOR_ACTION_LABELS: Record<CounselorEscalationAction, string> = {
  ADVISOR_CONTACT_MADE: "Spoke with the student directly",
  PARENT_GUARDIAN_NOTIFIED: "Parent or guardian contacted",
  DISTRICT_REFERRAL: "Referred to district office or compliance officer",
  PATHWAY_PIVOT_INITIATED: "Started D2/JUCO pathway conversation",
  WATCHLIST_ONLY: "Acknowledged — monitoring, no action yet",
};

export function counselorActionLabel(action: CounselorEscalationAction | null | undefined): string {
  if (!action) return "—";
  return COUNSELOR_ACTION_LABELS[action] ?? action;
}

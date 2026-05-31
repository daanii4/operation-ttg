import type { CounselorEscalationAction } from "@prisma/client";

export const COUNSELOR_ESCALATION_ACTIONS = [
  "REFERRED_CLINICIAN",
  "PARENT_CONTACT",
  "CRISIS_PROTOCOL",
  "DOCUMENTED_ONLY",
  "OTHER",
] as const satisfies readonly CounselorEscalationAction[];

export const COUNSELOR_ACTION_LABELS: Record<CounselorEscalationAction, string> = {
  REFERRED_CLINICIAN: "Referred to licensed clinician",
  PARENT_CONTACT: "Contacted parent or guardian",
  CRISIS_PROTOCOL: "Initiated crisis protocol",
  DOCUMENTED_ONLY: "Documented review only",
  OTHER: "Other action (describe in notes)",
};

export function counselorActionLabel(action: CounselorEscalationAction | null | undefined): string {
  if (!action) return "—";
  return COUNSELOR_ACTION_LABELS[action] ?? action;
}

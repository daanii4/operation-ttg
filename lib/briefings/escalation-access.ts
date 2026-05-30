import type { AdvisorRole } from "@prisma/client";

/** Assigned advisor or team owner may acknowledge a safety escalation. */
export function canAcknowledgeEscalation(input: {
  sessionUserId: string;
  teamRole: AdvisorRole;
  assignedAdvisorId: string | null | undefined;
}): boolean {
  if (input.teamRole === "owner") return true;
  if (!input.assignedAdvisorId) return true;
  return input.sessionUserId === input.assignedAdvisorId;
}

import type { AdvisorRole } from "@prisma/client";

/** Owner sees all; assigned advisor sees only their students' records (Build 06 §13.2c). */
export function canViewStudentAcknowledgment(input: {
  teamRole: AdvisorRole;
  sessionUserId: string;
  studentAdvisorId: string | null;
  acknowledgingAdvisorId: string;
}): boolean {
  if (input.teamRole === "owner") return true;
  if (input.sessionUserId === input.studentAdvisorId) return true;
  if (input.sessionUserId === input.acknowledgingAdvisorId) return true;
  return false;
}

export function canAccessAcknowledgmentAudit(teamRole: AdvisorRole): boolean {
  return teamRole === "owner" || teamRole === "advisor";
}

/**
 * Sprint 6 / Workstream C-3 — student visibility scope.
 *
 * Returns a Prisma `where` predicate that limits a StudentAthlete query to
 * the students the advisor is allowed to see, keyed by their team role:
 *
 *   • owner / viewer → no restriction (sees the full cohort).
 *   • advisor        → only students in `student_advisor_assignments`
 *                      where `advisor_id = session.userId`. Returns a
 *                      predicate that matches zero rows when no
 *                      assignments exist (NOT an error — the API surfaces
 *                      an empty roster + onboarding prompt per the spec).
 */

import type { AdvisorRole } from "@prisma/client";
import { prismaTtg } from "@/lib/prisma";

export type StudentScopeWhere = Record<string, never> | { id: { in: string[] } };

export async function getStudentScope(
  advisorId: string,
  role: AdvisorRole | null | undefined
): Promise<StudentScopeWhere> {
  if (!role || role === "owner" || role === "viewer") {
    return {};
  }

  const assignments = await prismaTtg.studentAdvisorAssignment.findMany({
    where: { advisor_id: advisorId },
    select: { student_id: true },
  });

  if (assignments.length === 0) {
    // Predicate that matches no rows. Using an empty `id IN ()` would be a
    // SQL error, so we use a sentinel UUID that StudentAthlete IDs (cuid)
    // can never match. The API caller treats an empty result as the
    // "onboarding" empty state.
    return { id: { in: ["__no_match_sentinel__"] } };
  }

  return { id: { in: assignments.map((a) => a.student_id) } };
}

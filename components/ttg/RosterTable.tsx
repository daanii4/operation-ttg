/**
 * @deprecated Use the canonical roster table at
 * `app/dashboard/roster/_components/RosterTable.tsx`.
 *
 * Thin adapter for callers that still pass raw cohort rows (e.g. overview previews).
 */
"use client";

import type { CohortStudentRow } from "@/app/api/cohort/route";
import { toQnRosterRows } from "@/lib/cohort/qn-roster";
import { RosterTable as CanonicalRosterTable } from "@/app/dashboard/roster/_components/RosterTable";

export function RosterTable({
  data,
  loading = false,
}: {
  data: CohortStudentRow[];
  /** @deprecated Sticky header is always on in the canonical table */
  stickyHeader?: boolean;
  loading?: boolean;
}) {
  return <CanonicalRosterTable rows={toQnRosterRows(data)} loading={loading} />;
}

export default RosterTable;

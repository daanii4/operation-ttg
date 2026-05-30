import type { RiskBand } from "@/components/ttg/risk-vocabulary";

/** NCAA 10/7 eligibility urgency — LOCKED is highest stakes. */
export const BAND_RANK: Record<RiskBand, number> = {
  LOCKED: 0,
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
};

export type RosterSortableRow = {
  riskBand: RiskBand;
  daysToLock: number | null;
  missingTotal: number;
  fullName: string;
  sport?: string;
  graduationYear?: number;
  completedTotal?: number;
};

export function compareRosterUrgency(a: RosterSortableRow, b: RosterSortableRow): number {
  const ra = BAND_RANK[a.riskBand] ?? 9;
  const rb = BAND_RANK[b.riskBand] ?? 9;
  if (ra !== rb) return ra - rb;
  const da = a.daysToLock ?? (a.riskBand === "LOCKED" ? -1 : Number.POSITIVE_INFINITY);
  const db = b.daysToLock ?? (b.riskBand === "LOCKED" ? -1 : Number.POSITIVE_INFINITY);
  if (da !== db) return da - db;
  if (b.missingTotal !== a.missingTotal) return b.missingTotal - a.missingTotal;
  return a.fullName.localeCompare(b.fullName);
}

export function sortByRosterUrgency<T extends RosterSortableRow>(rows: T[]): T[] {
  return [...rows].sort(compareRosterUrgency);
}

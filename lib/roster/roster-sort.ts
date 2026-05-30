import type { HolisticBand } from "./holistic-band";
import type { RiskBand } from "@/components/ttg/risk-vocabulary";
import { HOLISTIC_BAND_RANK } from "./holistic-band";

export { HOLISTIC_BAND_RANK as BAND_RANK };

export type RosterSortableRow = {
  band: HolisticBand;
  weeksToCriticalAction: number | null;
  missingTotal: number;
  daysToLock: number | null;
  riskBand: RiskBand;
  fullName: string;
};

/** Holistic urgency: ESCALATED → RED → YELLOW → GREEN, then weeks, missing cores, days to lock. */
export function compareRosterUrgency(a: RosterSortableRow, b: RosterSortableRow): number {
  const ra = HOLISTIC_BAND_RANK[a.band];
  const rb = HOLISTIC_BAND_RANK[b.band];
  if (ra !== rb) return ra - rb;

  const aw = a.weeksToCriticalAction ?? Number.POSITIVE_INFINITY;
  const bw = b.weeksToCriticalAction ?? Number.POSITIVE_INFINITY;
  if (aw !== bw) return aw - bw;

  if (b.missingTotal !== a.missingTotal) return b.missingTotal - a.missingTotal;

  const da = a.daysToLock ?? (a.riskBand === "LOCKED" ? -1 : Number.POSITIVE_INFINITY);
  const db = b.daysToLock ?? (b.riskBand === "LOCKED" ? -1 : Number.POSITIVE_INFINITY);
  if (da !== db) return da - db;

  return a.fullName.localeCompare(b.fullName);
}

export function sortByRosterUrgency<T extends RosterSortableRow>(rows: T[]): T[] {
  return [...rows].sort(compareRosterUrgency);
}

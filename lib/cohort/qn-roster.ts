/**
 * Cohort row deriver — holistic roll-up for roster triage; NCAA fields for lock runway.
 */

import type { CohortStudentRow } from "@/app/api/cohort/route";
import type { HolisticBand } from "@/lib/roster/holistic-band";
import type { RiskBand } from "@/components/ttg/risk-vocabulary";
import { deriveConcernTags, type ConcernTag } from "@/lib/roster/concern-tags";
import {
  deriveHolisticBand,
  deriveHolisticWeeks,
  normalizeNcaaRiskBand,
} from "@/lib/roster/holistic-band";
import { sortByRosterUrgency } from "@/lib/roster/roster-sort";

export type QnRosterRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  sport: string;
  grade: number;
  graduationYear: number;
  targetDivision: string;
  highSchoolName: string;
  /** Holistic worst-case band — roster Status column & default sort. */
  band: HolisticBand;
  /** NCAA 10/7 band — action window / past-lock only (not Status). */
  riskBand: RiskBand;
  daysToLock: number | null;
  provisionalFlag: boolean;
  completedTotal: number;
  completedEngMathSci: number;
  missingTotal: number;
  agDualFlagCount: number;
  weeksToCriticalAction: number | null;
  concernTags: ConcernTag[];
};

const REFERENCE_GRAD_YEAR = 2026;

function gradeToGradYear(grade: number): number {
  return REFERENCE_GRAD_YEAR + Math.max(0, 12 - grade);
}

function deriveWeeksFromDays(daysToLock: number | null, riskBand: RiskBand): number | null {
  if (riskBand === "LOCKED") return null;
  if (daysToLock == null) return null;
  const weeks = Math.ceil(daysToLock / 7);
  return weeks <= 4 ? weeks : null;
}

export function toQnRosterRow(row: CohortStudentRow): QnRosterRow {
  const band = deriveHolisticBand(row);
  const riskBand = normalizeNcaaRiskBand(row);
  const daysToLock = row.daysToLock;
  return {
    studentId: row.studentId,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: `${row.firstName} ${row.lastName}`,
    sport: row.sport,
    grade: row.grade,
    graduationYear: gradeToGradYear(row.grade),
    targetDivision: row.targetDivision,
    highSchoolName: row.highSchoolName,
    band,
    riskBand,
    daysToLock,
    provisionalFlag: row.provisionalFlag,
    completedTotal: row.completedTotal,
    completedEngMathSci: row.completedEngMathSci,
    missingTotal: row.missingTotal,
    agDualFlagCount: row.agDualFlagCount,
    weeksToCriticalAction: deriveWeeksFromDays(daysToLock, riskBand) ?? deriveHolisticWeeks(band),
    concernTags: deriveConcernTags(row),
  };
}

export function toQnRosterRows(rows: CohortStudentRow[]): QnRosterRow[] {
  return rows.map(toQnRosterRow);
}

/** Default sort uses holistic band urgency (never a rosier picture than worst-case). */
export function sortQnRosterRows(rows: QnRosterRow[]): QnRosterRow[] {
  return sortByRosterUrgency(rows);
}

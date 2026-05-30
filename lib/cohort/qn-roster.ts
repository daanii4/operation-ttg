/**
 * Cohort row deriver — NCAA 10/7 fields for Roster; holistic band for Briefings.
 */

import type { CohortStudentRow } from "@/app/api/cohort/route";
import type { Band } from "@/components/ui/qn";
import type { RiskBand } from "@/components/ttg/risk-vocabulary";
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
  /** Holistic roll-up (Briefings — may be ESCALATED). */
  band: Band;
  /** NCAA 10/7 band (Roster Status column). */
  riskBand: RiskBand;
  daysToLock: number | null;
  provisionalFlag: boolean;
  completedTotal: number;
  completedEngMathSci: number;
  missingTotal: number;
  agDualFlagCount: number;
  weeksToCriticalAction: number | null;
  primaryConcern: string | null;
};

const REFERENCE_GRAD_YEAR = 2026;

function gradeToGradYear(grade: number): number {
  return REFERENCE_GRAD_YEAR + Math.max(0, 12 - grade);
}

function normalizeRiskBand(row: CohortStudentRow): RiskBand {
  if (
    row.riskBand === "GREEN" ||
    row.riskBand === "YELLOW" ||
    row.riskBand === "RED" ||
    row.riskBand === "LOCKED"
  ) {
    return row.riskBand;
  }
  return "GREEN";
}

function deriveHolisticBand(row: CohortStudentRow): Band {
  if (row.overallRisk === "CRITICAL" && row.aimsRisk === "HIGH") return "ESCALATED";
  if (row.overallRisk === "CRITICAL") return "RED";
  if (row.overallRisk === "AT_RISK") return "YELLOW";
  return "GREEN";
}

function deriveWeeksFromDays(daysToLock: number | null, riskBand: RiskBand): number | null {
  if (riskBand === "LOCKED") return null;
  if (daysToLock == null) return null;
  const weeks = Math.ceil(daysToLock / 7);
  return weeks <= 4 ? weeks : null;
}

function deriveHolisticWeeks(band: Band): number | null {
  switch (band) {
    case "ESCALATED":
      return 0;
    case "RED":
      return 1;
    case "YELLOW":
      return 4;
    default:
      return null;
  }
}

function derivePrimaryConcern(row: CohortStudentRow): string | null {
  if (row.recommendedAdvisorAction) return row.recommendedAdvisorAction;
  if (row.aimsReason) return row.aimsReason;
  if (row.gpaTrajectory === "declining") return "GPA trending down";
  if (row.agMissingCount > 0) return `${row.agMissingCount} A-G subject(s) missing`;
  return null;
}

export function toQnRosterRow(row: CohortStudentRow): QnRosterRow {
  const band = deriveHolisticBand(row);
  const riskBand = normalizeRiskBand(row);
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
    primaryConcern: derivePrimaryConcern(row),
  };
}

export function toQnRosterRows(rows: CohortStudentRow[]): QnRosterRow[] {
  return rows.map(toQnRosterRow);
}

/** Roster default: LOCKED → RED → YELLOW → GREEN, daysToLock asc, missingTotal desc. */
export function sortQnRosterRows(rows: QnRosterRow[]): QnRosterRow[] {
  return sortByRosterUrgency(rows);
}

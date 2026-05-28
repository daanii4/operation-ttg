/**
 * QuasarNova v1 — roster row deriver.
 *
 * Translates the existing CohortStudentRow into the four-band composite shape
 * the v1 Roster + Briefings tabs render. The actual F12 master briefing is
 * the source of truth for `composite_band` and `weeks_to_critical_action`,
 * but pulling F12 for every student on every cohort fetch is wasteful — so
 * we derive the same buckets from data we already compute in
 * `buildCohortResponse()`. The Briefings tab still loads the per-student F12
 * lazily for full detail.
 */

import type { CohortStudentRow } from "@/app/api/cohort/route";
import type { Band } from "@/components/ui/qn";

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
  band: Band;
  weeksToCriticalAction: number | null;
  primaryConcern: string | null;
};

const REFERENCE_GRAD_YEAR = 2026;

function gradeToGradYear(grade: number): number {
  // 12th grade graduates in REFERENCE_GRAD_YEAR; each lower grade adds a year.
  return REFERENCE_GRAD_YEAR + Math.max(0, 12 - grade);
}

function deriveBand(row: CohortStudentRow): Band {
  // ESCALATED is the highest-urgency bucket — used when a critical row is
  // also flagged as needing immediate advisor contact (F8 escalation_required
  // proxy: AIMS HIGH overrides into ESCALATED).
  if (row.overallRisk === "CRITICAL" && row.aimsRisk === "HIGH") return "ESCALATED";
  if (row.overallRisk === "CRITICAL") return "RED";
  if (row.overallRisk === "AT_RISK") return "YELLOW";
  return "GREEN";
}

function deriveWeeks(band: Band): number | null {
  // Spec §1.2 keeps the action window human-readable: ≤2 → red, 3–4 → yellow,
  // GREEN never renders. ESCALATED collapses to 0 weeks (immediate).
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
  const band = deriveBand(row);
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
    weeksToCriticalAction: deriveWeeks(band),
    primaryConcern: derivePrimaryConcern(row),
  };
}

export function toQnRosterRows(rows: CohortStudentRow[]): QnRosterRow[] {
  return rows.map(toQnRosterRow);
}

const BAND_RANK: Record<Band, number> = {
  ESCALATED: 0,
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
};

/**
 * Default sort: ESCALATED → RED → YELLOW → GREEN, then by
 * weeks_to_critical_action ascending (null last), then by name.
 * Used by both the roster default ordering and the briefing list.
 */
export function sortQnRosterRows(rows: QnRosterRow[]): QnRosterRow[] {
  return [...rows].sort((a, b) => {
    if (BAND_RANK[a.band] !== BAND_RANK[b.band]) {
      return BAND_RANK[a.band] - BAND_RANK[b.band];
    }
    const aw = a.weeksToCriticalAction ?? Number.POSITIVE_INFINITY;
    const bw = b.weeksToCriticalAction ?? Number.POSITIVE_INFINITY;
    if (aw !== bw) return aw - bw;
    return a.fullName.localeCompare(b.fullName);
  });
}

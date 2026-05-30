import type { CohortStudentRow } from "@/app/api/cohort/route";
import type { RiskBand } from "@/components/ttg/risk-vocabulary";

const LOCK_WINDOW_DAYS = 60;

export function filterApproachingLockQueue(students: CohortStudentRow[]): CohortStudentRow[] {
  return students.filter((s) => {
    if (s.missingTotal <= 0) return false;
    if (s.riskBand === "LOCKED") return true;
    if (s.daysToLock == null) return false;
    return s.daysToLock <= LOCK_WINDOW_DAYS;
  });
}

export function sortApproachingLockQueue(students: CohortStudentRow[]): CohortStudentRow[] {
  return [...students].sort((a, b) => {
    const aLocked = a.riskBand === "LOCKED";
    const bLocked = b.riskBand === "LOCKED";
    if (aLocked && !bLocked) return -1;
    if (!aLocked && bLocked) return 1;
    const da = a.daysToLock ?? (aLocked ? -1 : Number.POSITIVE_INFINITY);
    const db = b.daysToLock ?? (bLocked ? -1 : Number.POSITIVE_INFINITY);
    return da - db;
  });
}

export function buildApproachingLockQueue(students: CohortStudentRow[]): CohortStudentRow[] {
  return sortApproachingLockQueue(filterApproachingLockQueue(students));
}

export function bandStatusToken(band: RiskBand | "NOT_APPLICABLE"): string {
  switch (band) {
    case "GREEN":
      return "var(--status-track)";
    case "YELLOW":
      return "var(--status-support)";
    case "RED":
      return "var(--status-urgent)";
    case "LOCKED":
      return "var(--status-escalated)";
    default:
      return "var(--text-tertiary)";
  }
}

export function bandTintClass(band: RiskBand): string {
  switch (band) {
    case "GREEN":
      return "bg-status-track-tint text-status-track border border-[color:var(--status-track-border)]";
    case "YELLOW":
      return "bg-status-support-tint text-status-support border border-[color:var(--status-support-border)]";
    case "RED":
      return "bg-status-urgent-tint text-status-urgent border border-[color:var(--status-urgent-border)]";
    case "LOCKED":
      return "bg-status-escalated-tint text-status-escalated border border-[color:var(--status-escalated-border)]";
  }
}

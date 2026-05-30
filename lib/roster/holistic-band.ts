import type { CohortStudentRow } from "@/app/api/cohort/route";
import type { Band } from "@/components/ui/qn";

/** Four-band holistic triage scale (roster Status — never LOCKED). */
export type HolisticBand = "GREEN" | "YELLOW" | "RED" | "ESCALATED";
import type { RiskBand } from "@/components/ttg/risk-vocabulary";

/** Holistic triage urgency (lower = more urgent). */
export const HOLISTIC_BAND_RANK: Record<HolisticBand, number> = {
  ESCALATED: 0,
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
};

export const HOLISTIC_BANDS: HolisticBand[] = ["GREEN", "YELLOW", "RED", "ESCALATED"];

export function normalizeNcaaRiskBand(row: CohortStudentRow): RiskBand {
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

/** Map NCAA band into the holistic four-band scale for worst-case comparison. */
export function ncaaBandAsHolistic(ncaa: RiskBand): HolisticBand {
  switch (ncaa) {
    case "LOCKED":
    case "RED":
      return "RED";
    case "YELLOW":
      return "YELLOW";
    default:
      return "GREEN";
  }
}

/** Pick the more urgent of two holistic bands. */
export function worseHolisticBand(a: HolisticBand, b: HolisticBand): HolisticBand {
  return HOLISTIC_BAND_RANK[a] <= HOLISTIC_BAND_RANK[b] ? a : b;
}

/**
 * Holistic roll-up for roster triage — never understate vs NCAA 10/7 or AIMS.
 * Roster Status = this band; student profile holds per-framework detail.
 */
export function deriveHolisticBand(row: CohortStudentRow): HolisticBand {
  let fromFrameworks: HolisticBand = "GREEN";
  if (row.overallRisk === "CRITICAL" && row.aimsRisk === "HIGH") {
    fromFrameworks = "ESCALATED";
  } else if (row.overallRisk === "CRITICAL") {
    fromFrameworks = "RED";
  } else if (row.overallRisk === "AT_RISK") {
    fromFrameworks = "YELLOW";
  }

  const ncaa = ncaaBandAsHolistic(normalizeNcaaRiskBand(row));
  let band = worseHolisticBand(fromFrameworks, ncaa);

  if (row.riskBand === "LOCKED" && band === "YELLOW") {
    band = "RED";
  }

  return band;
}

export function deriveHolisticWeeks(band: HolisticBand): number | null {
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

/**
 * Canonical NCAA / A-G authority citations for defensibility surfaces.
 * Store URL, label, and cycle year together so staleness is detectable.
 */

export type AuthorityCitation = {
  sourceUrl: string;
  sourceLabel: string;
  sourceAuthority: string;
  cycleYear: number;
};

/** NCAA 10/7, core completion, and GPA qualifier citations. */
export const NCAA_BYLAW_14_3: AuthorityCitation = {
  sourceUrl: "https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/",
  sourceLabel: "NCAA Bylaw 14.3",
  sourceAuthority:
    "NCAA Division I & II Initial-Eligibility brochures and Eligibility Center core-course requirements (2025-26 cycle)",
  cycleYear: 2025,
};

/** California A-G (UC/CSU) subject completion. */
export const CALIFORNIA_AG_AUTHORITY: AuthorityCitation = {
  sourceUrl:
    "https://admission.universityofcalifornia.edu/admissions-requirements/freshman-requirements/a-g-requirements/",
  sourceLabel: "UC A-G subject requirements",
  sourceAuthority:
    "University of California Office of the President — A-G course list and year requirements",
  cycleYear: 2025,
};

/** True when citation cycle is more than 12 months behind the calendar year. */
export function isCitationStale(
  citation: AuthorityCitation,
  asOf: Date = new Date()
): boolean {
  return asOf.getFullYear() - citation.cycleYear > 1;
}

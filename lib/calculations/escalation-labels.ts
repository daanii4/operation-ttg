/**
 * Sprint 6 / Workstream A4-1 — escalation label expansion (May 2026).
 *
 * Source of truth for translating any machine code emitted by F8
 * (`escalation_reason`) or F12 (`primary_concern`) into the human-readable
 * string an advisor sees in the UI.
 *
 * Two rules every caller must follow:
 *   1. Look up the label via the helper `escalationLabel(code)` below — never
 *      index `ESCALATION_LABELS[code]` directly. The helper returns the
 *      `unknown` fallback if a code isn't mapped, so a forgotten entry shows
 *      a graceful message instead of a raw machine string.
 *   2. Adding a new escalation reason or primary concern in the calc layer
 *      (F8 / F12) requires a matching entry here in the same change. The
 *      jest test in `__tests__/escalation-labels.test.ts` enforces this.
 */

export const ESCALATION_LABELS: Record<string, string> = {
  // ─── F8 escalation reasons ──────────────────────────────────────────────
  f5_lock_in:
    "10/7 lock-in date has passed — eligibility window is closed",
  ncaa_gpa_non_qualifier:
    "Student does not meet NCAA GPA qualifier threshold",
  d1_closure:
    "D1 eligibility pathway is closed based on current core course completion",
  d1_gpa_below_partial:
    "GPA is below NCAA D1 partial qualifier threshold",
  d2_closure:
    "D2 eligibility pathway is closed",
  a_g_completion_deficit:
    "A-G subject area requirements cannot be completed before graduation",
  dual_flag_critical:
    "Dual-flag course detected — A-G and NCAA credit at risk simultaneously",

  // ─── F12 primary concerns ───────────────────────────────────────────────
  a_g_completion:
    "A-G completion falling behind required pace",
  a_g_gpa:
    "A-G GPA trajectory indicates risk of falling below UC minimum",
  ncaa_core_completion:
    "NCAA core course completion behind required sequence",
  ncaa_gpa_trajectory:
    "NCAA core GPA declining toward non-qualifier threshold",
  engagement_withdrawal:
    "Student engagement pattern indicates withdrawal risk",
  aims_high_risk:
    "AIMS psychometric assessment indicates elevated risk",
  gpa_regression:
    "GPA trajectory shows statistically significant decline",

  // ─── Acknowledgment states ──────────────────────────────────────────────
  re_escalated_after_ack:
    "Conditions have degraded since last acknowledgment — re-review required",

  // ─── Fallback — should never reach the UI in production ────────────────
  unknown:
    "Unknown escalation reason — contact system administrator",
};

/**
 * Safe lookup: returns the mapped label or the `unknown` fallback so the UI
 * never renders a raw machine code. Pass nullish (or empty string) for a
 * "no escalation" caller and you'll get the unknown fallback message — UI
 * code should still gate display on the presence of a code first.
 */
export function escalationLabel(code: string | null | undefined): string {
  if (!code) return ESCALATION_LABELS.unknown!;
  return ESCALATION_LABELS[code] ?? ESCALATION_LABELS.unknown!;
}

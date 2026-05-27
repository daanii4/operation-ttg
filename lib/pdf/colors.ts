/**
 * Sprint 5 — PDF color palette.
 *
 * These hex values are the source of truth for `@react-pdf/renderer` styles.
 * They mirror the on-screen band tokens but stay independent so the PDF will
 * render identically when CSS variables aren't available (PDF runtime has no
 * stylesheet — only inline styles).
 */
export const PDF_COLORS = {
  GREEN: "#16A34A",
  YELLOW: "#D97706",
  RED: "#DC2626",
  ESCALATED: "#7C3AED",
  MUTED: "#6B7280",
  BORDER: "#E5E7EB",
  ROW_ALT: "#F9FAFB",
  TEXT: "#111827",
} as const;

export type PdfBandKey = "GREEN" | "YELLOW" | "RED" | "ESCALATED";

export function bandColor(band: PdfBandKey | string | null | undefined): string {
  switch (band) {
    case "GREEN":
      return PDF_COLORS.GREEN;
    case "YELLOW":
      return PDF_COLORS.YELLOW;
    case "RED":
      return PDF_COLORS.RED;
    case "ESCALATED":
      return PDF_COLORS.ESCALATED;
    default:
      return PDF_COLORS.MUTED;
  }
}

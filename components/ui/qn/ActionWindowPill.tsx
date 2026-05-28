/**
 * QuasarNova v1 — §1.2 ActionWindowPill
 *
 * Renders the time-to-action pill paired with a Clock icon.
 *
 * Visibility rules (spec §1.2):
 *   • weeks ∈ {1, 2}  → RED, label "Action in {n} {week|weeks}"
 *   • weeks ∈ {3, 4}  → YELLOW
 *   • weeks > 4 or null → render nothing (not in action window)
 */

import * as React from "react";
import { Clock } from "lucide-react";

export interface ActionWindowPillProps {
  weeks: number | null | undefined;
  className?: string;
}

export function ActionWindowPill({ weeks, className }: ActionWindowPillProps) {
  if (weeks == null) return null;
  if (weeks > 4) return null;

  const isRed = weeks <= 2;
  const tone = isRed
    ? {
        background: "var(--color-red-tint)",
        border: "var(--color-red)",
        text: "var(--color-red)",
      }
    : {
        background: "var(--color-yellow-tint)",
        border: "var(--color-yellow)",
        text: "var(--color-yellow)",
      };

  const label =
    weeks === 1 ? "Action in 1 week" : `Action in ${weeks} weeks`;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap",
        "text-[11px] font-semibold leading-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        background: tone.background,
        borderColor: tone.border,
        color: tone.text,
        paddingTop: 3,
        paddingBottom: 3,
        paddingLeft: 10,
        paddingRight: 10,
        minHeight: 22,
      }}
      role="status"
      aria-label={label}
    >
      <Clock size={12} aria-hidden style={{ color: tone.text }} />
      {label}
    </span>
  );
}

export default ActionWindowPill;

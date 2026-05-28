/**
 * QuasarNova v1 — §1.3 EvidenceTierChip
 *
 * Text-only chip aligned to the bottom-right of any data card. No background.
 * Insufficient is rendered in italic + AlertTriangle icon so the cautionary
 * tier reads differently from Deterministic / Provisional even at small sizes.
 */

import * as React from "react";
import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EvidenceTier = "Deterministic" | "Provisional" | "Insufficient";

const TIERS: Record<
  EvidenceTier,
  { color: string; icon: LucideIcon; italic: boolean; label: string }
> = {
  Deterministic: {
    color: "var(--color-green)",
    icon: CheckCircle2,
    italic: false,
    label: "Deterministic",
  },
  Provisional: {
    color: "var(--color-yellow)",
    icon: CircleDashed,
    italic: false,
    label: "Provisional",
  },
  Insufficient: {
    color: "var(--color-red)",
    icon: AlertTriangle,
    italic: true,
    label: "Insufficient",
  },
};

export interface EvidenceTierChipProps {
  tier: EvidenceTier;
  className?: string;
  /** Optional descriptor displayed after the tier (e.g. "across all layers"). */
  detail?: string;
}

export function EvidenceTierChip({
  tier,
  className,
  detail,
}: EvidenceTierChipProps) {
  const t = TIERS[tier];
  const Icon = t.icon;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 text-[11px] font-medium leading-4",
        t.italic ? "italic" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ color: t.color }}
    >
      <Icon size={12} aria-hidden style={{ color: t.color }} />
      <span>{t.label}</span>
      {detail ? (
        <span className="text-[11px] font-normal" style={{ color: "var(--color-muted)" }}>
          · {detail}
        </span>
      ) : null}
    </span>
  );
}

export default EvidenceTierChip;

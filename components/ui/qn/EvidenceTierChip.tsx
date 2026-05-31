/**
 * QuasarNova v1 — §1.3 EvidenceTierChip
 *
 * Vocabulary labels for defensibility surfaces — equal visual weight per tier.
 */

import * as React from "react";
import {
  AlertCircle,
  MinusCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type EvidenceTier = "Deterministic" | "Provisional" | "Insufficient";

const TIERS: Record<
  EvidenceTier,
  {
    label: string;
    icon: LucideIcon;
    className: string;
  }
> = {
  Deterministic: {
    label: "Verified",
    icon: ShieldCheck,
    className: "border-olive-200 bg-olive-100 text-olive-700",
  },
  Provisional: {
    label: "Provisional — assumptions applied",
    icon: AlertCircle,
    className: "border-gold-200 bg-gold-100 text-gold-700",
  },
  Insufficient: {
    label: "Insufficient evidence",
    icon: MinusCircle,
    className: "border-[color:var(--border-default)] bg-surface-inner text-text-tertiary",
  },
};

export interface EvidenceTierChipProps {
  tier: EvidenceTier;
  className?: string;
  /** Optional descriptor displayed after the tier (e.g. "across all layers"). */
  detail?: string;
}

export function EvidenceTierChip({ tier, className, detail }: EvidenceTierChipProps) {
  const t = TIERS[tier];
  const Icon = t.icon;
  return (
    <span
      className={[
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5",
        "font-sans text-[11px] font-medium leading-4",
        t.className,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      <Icon size={12} aria-hidden className="shrink-0" />
      <span className="truncate">{t.label}</span>
      {detail ? (
        <span className="hidden font-normal sm:inline">· {detail}</span>
      ) : null}
    </span>
  );
}

export default EvidenceTierChip;

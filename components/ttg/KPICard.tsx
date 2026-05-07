"use client";
import * as React from "react";
import { RISK_VOCABULARY } from "./risk-vocabulary";

const BAND_TOKEN: Record<"GREEN" | "YELLOW" | "RED" | "LOCKED", { color: string; border: string }> = {
  GREEN:  { color: "var(--band-track)",   border: "var(--band-track-border)" },
  YELLOW: { color: "var(--band-support)", border: "var(--band-support-border)" },
  RED:    { color: "var(--band-urgent)",  border: "var(--band-urgent-border)" },
  LOCKED: { color: "var(--band-pivot)",   border: "var(--band-pivot-border)" },
};

type KPICardProps = {
  band: "GREEN" | "YELLOW" | "RED" | "LOCKED";
  count: number;
  subLabel?: string;
};

export function KPICard({ band, count, subLabel }: KPICardProps) {
  const t = BAND_TOKEN[band];
  const vocabulary = RISK_VOCABULARY[band];
  const Icon = vocabulary.icon;
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={`${band}: ${count} ${subLabel}`}
      className="group flex cursor-default flex-col gap-2 rounded bg-surface-card p-5 shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        border: `1px solid ${t.border}`,
        // @ts-expect-error css var
        "--focus-color": t.color,
        outlineColor: t.color,
      }}
    >
      <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
        {vocabulary.label}
      </div>
      <div
        className="font-mono text-[36px] font-medium leading-none"
        style={{ color: t.color }}
      >
        {count}
      </div>
      <div className="flex items-center gap-1.5 font-sans text-[12px] text-text-secondary">
        <Icon className="h-3.5 w-3.5" style={{ color: t.color }} aria-hidden />
        {subLabel ?? vocabulary.subLabel}
      </div>
    </div>
  );
}

export default KPICard;

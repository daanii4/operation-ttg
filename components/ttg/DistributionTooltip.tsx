"use client";
import * as React from "react";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";

type TooltipPayloadItem = {
  dataKey?: string | number;
  value?: number;
  color?: string;
};

type Props = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
};

const BAND_KEYS = ["GREEN", "YELLOW", "RED", "LOCKED"] as const;

function bandLabel(dataKey: string): string {
  if (BAND_KEYS.includes(dataKey as (typeof BAND_KEYS)[number])) {
    return RISK_VOCABULARY[dataKey as (typeof BAND_KEYS)[number]].label;
  }
  return dataKey;
}

export function DistributionTooltip({ active, payload, label }: Props) {
  if (!active || !payload?.length) return null;
  const bucket = String(label ?? "");
  const reversed = [...payload].reverse();

  return (
    <div
      className="rounded border border-[color:var(--border-default)] bg-surface-card p-3 shadow-md"
      style={{ minWidth: 200 }}
    >
      <div className="flex flex-col gap-1.5">
        {reversed.map((p) => {
          const key = String(p.dataKey ?? "");
          const count = (p.value as number) ?? 0;
          if (count <= 0) return null;
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 font-mono text-[11px] text-text-primary"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: p.color as string }}
                  aria-hidden
                />
                <span className="font-sans text-[11px] text-text-secondary">
                  {bandLabel(key)} · {bucket}
                </span>
              </span>
              <span>
                {count} athlete{count === 1 ? "" : "s"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DistributionTooltip;

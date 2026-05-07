"use client";
import * as React from "react";
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

export function DistributionTooltip({ active, payload, label }: Props) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + ((p.value as number) ?? 0), 0);
  const reversed = [...payload].reverse();
  return (
    <div className="rounded border border-gold-500 bg-surface-inverse p-3 shadow-lg" style={{ minWidth: 160 }}>
      <div className="mb-1.5 font-mono text-[11px] text-white/60">{label}</div>
      <div className="mb-2 font-mono text-[12px] text-white">
        {total} student{total === 1 ? "" : "s"} total
      </div>
      <div className="flex flex-col gap-1">
        {reversed.map((p) => (
          <div
            key={String(p.dataKey)}
            className="flex items-center justify-between gap-4 font-mono text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: p.color as string }}
              />
              <span className="uppercase text-white/80">{String(p.dataKey)}</span>
            </span>
            <span className="text-white">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DistributionTooltip;

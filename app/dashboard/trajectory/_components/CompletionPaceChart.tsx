"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PaceChartModel } from "@/lib/trajectory/build-completion-pace-series";

function mergeChartData(model: PaceChartModel) {
  const keys = new Set<string>();
  for (const p of model.points) keys.add(p.key);
  for (const p of model.paceTotal) keys.add(p.key);
  if (model.paceEms) for (const p of model.paceEms) keys.add(p.key);
  if (model.lockKey) keys.add(model.lockKey);

  const ordered = Array.from(keys).sort();
  return ordered.map((key) => {
    const point = model.points.find((p) => p.key === key);
    const paceT = model.paceTotal.find((p) => p.key === key);
    const paceE = model.paceEms?.find((p) => p.key === key);
    return {
      key,
      label: point?.label ?? key,
      cumulativeTotal: point?.cumulativeTotal ?? null,
      cumulativeEms: point?.cumulativeEms ?? null,
      targetTotal: paceT?.targetTotal ?? null,
      targetEms: paceE?.targetEms ?? null,
      isCurrent: point?.isCurrent ?? false,
    };
  });
}

export interface CompletionPaceChartProps {
  model: PaceChartModel;
  ariaLabel: string;
  animateBars: boolean;
}

export default function CompletionPaceChart({
  model,
  ariaLabel,
  animateBars,
}: CompletionPaceChartProps) {
  const data = React.useMemo(() => mergeChartData(model), [model]);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = animateBars && !reducedMotion;

  if (data.length === 0) {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        className="flex h-[240px] w-full items-center justify-center rounded-md bg-surface-inner"
      >
        <p className="px-4 text-center font-sans text-[13px] text-text-tertiary">
          No completed cores recorded yet — add courses from Intake.
        </p>
      </div>
    );
  }

  return (
    <div role="img" aria-label={ariaLabel} className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid
            stroke="var(--border-default)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border-default)" }}
            tickLine={{ stroke: "var(--border-default)" }}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            allowDataOverflow={false}
            tick={{
              fill: "var(--text-tertiary)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
            axisLine={{ stroke: "var(--border-default)" }}
            tickLine={{ stroke: "var(--border-default)" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "var(--surface-card)",
              fontSize: 12,
            }}
            formatter={(value, name, item) => {
              const row = item.payload as {
                label: string;
                targetTotal: number | null;
                targetEms: number | null;
              };
              if (name === "cumulativeTotal" && typeof value === "number") {
                return [
                  `${value} cores · target ${row.targetTotal ?? "—"}`,
                  "Total cores",
                ];
              }
              if (name === "cumulativeEms" && typeof value === "number") {
                return [
                  `${value} EMS · target ${row.targetEms ?? "—"}`,
                  "Eng/Math/Sci",
                ];
              }
              return null;
            }}
            labelFormatter={(label) => String(label)}
          />
          <Bar
            dataKey="cumulativeTotal"
            fill="var(--olive-500)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={animate}
            animationDuration={220}
            name="cumulativeTotal"
            shape={(props) => {
              const { x, y, width, height, payload } = props as {
                x: number;
                y: number;
                width: number;
                height: number;
                payload?: { isCurrent?: boolean };
              };
              const fill = payload?.isCurrent
                ? "var(--olive-600)"
                : "var(--olive-500)";
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={fill}
                  rx={6}
                  ry={6}
                />
              );
            }}
          />
          <Line
            type="linear"
            dataKey="targetTotal"
            stroke="var(--gold-600)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            name="targetTotal"
            isAnimationActive={false}
          />
          {model.showEmsLine && model.paceEms ? (
            <Line
              type="linear"
              dataKey="targetEms"
              stroke="var(--gold-500)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              name="targetEms"
              isAnimationActive={false}
            />
          ) : null}
          {model.lockKey ? (
            <ReferenceLine
              x={data.find((d) => d.key === model.lockKey)?.label ?? model.lockKey}
              stroke="var(--status-escalated)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: model.pastLock ? "Locked" : "Lock",
                position: "top",
                fill: "var(--status-escalated)",
                fontSize: 11,
              }}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

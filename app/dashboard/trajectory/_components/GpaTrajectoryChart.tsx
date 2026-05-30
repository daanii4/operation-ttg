"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrajectoryDirection } from "@/lib/calculations/types";

function strokeForDirection(direction: TrajectoryDirection | null | undefined): string {
  switch (direction) {
    case "improving":
      return "var(--status-track)";
    case "declining":
      return "var(--status-urgent)";
    default:
      return "var(--status-support)";
  }
}

export interface GpaTrajectoryChartProps {
  slope: number | null;
  ci: [number, number] | null;
  direction: TrajectoryDirection | null;
  samples: Array<{ x: number; y: number; label: string }>;
  ariaLabel: string;
  animateDrawIn: boolean;
}

export default function GpaTrajectoryChart({
  slope,
  ci,
  direction,
  samples,
  ariaLabel,
  animateDrawIn,
}: GpaTrajectoryChartProps) {
  const actualStroke = strokeForDirection(direction);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shouldAnimate = animateDrawIn && !reducedMotion;

  if (samples.length === 0) {
    return (
      <div
        aria-hidden
        className="h-[240px] w-full rounded-md bg-surface-inner"
      />
    );
  }

  const meanX = samples.reduce((s, p) => s + p.x, 0) / samples.length;
  const meanY = samples.reduce((s, p) => s + p.y, 0) / samples.length;
  const minX = samples[0]!.x;
  const maxX = samples[samples.length - 1]!.x;

  const data = samples.map((p, idx) => ({
    x: p.x,
    label: p.label,
    actual: p.y,
    regression: slope != null ? meanY + slope * (p.x - meanX) : null,
    isLast: idx === samples.length - 1,
  }));

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="h-[240px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
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
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{
              fill: "var(--text-tertiary)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
            axisLine={{ stroke: "var(--border-default)" }}
            tickLine={{ stroke: "var(--border-default)" }}
          />
          {ci ? (
            <ReferenceArea
              y1={ci[0]}
              y2={ci[1]}
              fill="var(--olive-200)"
              fillOpacity={0.18}
              ifOverflow="extendDomain"
              stroke="none"
            />
          ) : null}
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border-default)",
              background: "var(--surface-card)",
              fontSize: 12,
              color: "var(--text-primary)",
            }}
            formatter={(value, name) => {
              if (name === "regression") return null;
              return typeof value === "number"
                ? [`${value.toFixed(2)} GPA`, "Observed"]
                : null;
            }}
            labelFormatter={(label) => String(label)}
            labelStyle={{ color: "var(--text-tertiary)", fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={actualStroke}
            strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload?: { isLast?: boolean };
              };
              const r = payload?.isLast ? 5 : 3;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="var(--surface-card)"
                  stroke={actualStroke}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 5, stroke: actualStroke, strokeWidth: 2 }}
            name="actual"
            isAnimationActive={shouldAnimate}
            animationDuration={500}
            animationEasing="ease-out"
          />
          {slope != null ? (
            <Line
              type="linear"
              dataKey="regression"
              stroke="var(--olive-700)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              name="regression"
              isAnimationActive={false}
              aria-hidden
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

/**
 * Sprint 6 / A4-3 — Recharts inner chart for the GPA Trajectory card.
 *
 * Splitting the chart from the card lets the card render its chrome
 * server-side; the heavy Recharts bundle only loads on the client.
 *
 * The OLS regression line is computed from the slope coming out of F9 plus
 * the average of the observed samples — F9 already produces the slope value,
 * so we don't recompute it here. We just render a straight line across the
 * x-domain anchored at (mean_x, mean_y) using the F9 slope.
 */

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

const COLORS = {
  actual: "#16A34A",
  regression: "#7C3AED",
  ci: "rgba(124, 58, 237, 0.10)",
  grid: "var(--border-default)",
  axis: "var(--text-tertiary)",
  text: "var(--text-primary)",
};

export interface GpaTrajectoryChartProps {
  slope: number | null;
  ci: [number, number] | null;
  samples: Array<{ x: number; y: number; label: string }>;
}

export default function GpaTrajectoryChart({
  slope,
  ci,
  samples,
}: GpaTrajectoryChartProps) {
  if (samples.length === 0) {
    return (
      <div
        aria-hidden
        style={{
          width: "100%",
          height: 240,
          background: "var(--surface-inner)",
          borderRadius: 6,
        }}
      />
    );
  }

  // Build a regression line spanning the same x-domain as the samples,
  // anchored at the (mean_x, mean_y) so the line passes through the dataset
  // centroid (standard OLS interpretation when the slope is given).
  const meanX = samples.reduce((s, p) => s + p.x, 0) / samples.length;
  const meanY = samples.reduce((s, p) => s + p.y, 0) / samples.length;
  const minX = samples[0]!.x;
  const maxX = samples[samples.length - 1]!.x;

  const regressionLine =
    slope != null
      ? [
          { x: minX, y: meanY + slope * (minX - meanX) },
          { x: maxX, y: meanY + slope * (maxX - meanX) },
        ]
      : null;

  const data = samples.map((p) => ({
    x: p.x,
    label: p.label,
    actual: p.y,
    regression:
      regressionLine != null
        ? meanY + slope! * (p.x - meanX)
        : null,
  }));

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: COLORS.axis, fontSize: 11 }}
            axisLine={{ stroke: COLORS.grid }}
            tickLine={{ stroke: COLORS.grid }}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fill: COLORS.axis, fontSize: 11 }}
            axisLine={{ stroke: COLORS.grid }}
            tickLine={{ stroke: COLORS.grid }}
          />
          {ci ? (
            <ReferenceArea
              y1={ci[0]}
              y2={ci[1]}
              fill={COLORS.ci}
              ifOverflow="extendDomain"
              stroke="none"
            />
          ) : null}
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              border: "1px solid var(--border-default)",
              background: "var(--surface-card)",
              fontSize: 12,
              color: COLORS.text,
            }}
            formatter={(v) => (typeof v === "number" ? v.toFixed(2) : String(v ?? "—"))}
            labelStyle={{ color: COLORS.axis, fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={COLORS.actual}
            strokeWidth={2}
            dot={{ r: 3, stroke: COLORS.actual, fill: "#FFFFFF" }}
            activeDot={{ r: 4 }}
            name="GPA"
            isAnimationActive={false}
          />
          {regressionLine ? (
            <Line
              type="linear"
              dataKey="regression"
              stroke={COLORS.regression}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              name="Regression"
              isAnimationActive={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

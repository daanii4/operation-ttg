"use client";
import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LockBucket } from "@/app/api/cohort/route";
import DistributionTooltip from "./DistributionTooltip";

const tickStyle = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: 11,
  fill: "var(--text-tertiary)",
};

export default function DistributionChartInner({ data }: { data: LockBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid
          strokeDasharray="2 4"
          stroke="rgba(92,107,70,0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={tickStyle}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={tickStyle}
          allowDecimals={false}
          domain={[0, "dataMax"]}
          width={32}
        />
        <Tooltip
          content={<DistributionTooltip />}
          cursor={{ fill: "rgba(92,107,70,0.04)" }}
        />
        <Bar
          dataKey="GREEN"
          stackId="band"
          fill="var(--band-green)"
          isAnimationActive={false}
        />
        <Bar
          dataKey="YELLOW"
          stackId="band"
          fill="var(--band-yellow)"
          isAnimationActive={false}
        />
        <Bar
          dataKey="RED"
          stackId="band"
          fill="var(--band-red)"
          isAnimationActive={false}
        />
        <Bar
          dataKey="LOCKED"
          stackId="band"
          fill="var(--band-locked)"
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

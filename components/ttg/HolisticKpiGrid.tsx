"use client";
import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { BandKey } from "@/components/ui/Badge";
import type { HolisticSummary } from "@/lib/calculations/holistic-rollup";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";

type Props = {
  summary: HolisticSummary;
  className?: string;
};

export function HolisticKpiGrid({ summary, className }: Props) {
  return (
    <Card variant="default" padding="lg" className={["mt-8", className].filter(Boolean).join(" ")}>
      <div className="mb-5">
        <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
          Holistic Early Warning Roll-Up
        </h2>
        <p className="mt-1 font-sans text-[12px] text-text-tertiary">
          NCAA 10/7 is one lens. This view also surfaces A-G, GPA trajectory, and AIMS escalation.
        </p>
      </div>
      <div className="grid gap-4 desktop:grid-cols-4 tablet:grid-cols-2 mobile:grid-cols-1">
        <FrameworkCard
          title="NCAA D1 10/7"
          caption="Core-course lock-in"
          items={(["GREEN", "YELLOW", "RED", "LOCKED"] as const).map((b) => {
            const v = RISK_VOCABULARY[b];
            return {
              rowKey: b,
              label: v.label,
              count: summary.tenSeven[b],
              band: v.band,
              icon: v.icon,
            };
          })}
        />
        <FrameworkCard
          title="California A-G"
          caption="UC/CSU subject completion"
          items={(["GREEN", "YELLOW", "RED"] as const).map((b) => {
            const v = RISK_VOCABULARY[b];
            return {
              rowKey: b,
              label: v.label,
              count: summary.ag[b],
              band: v.band,
              icon: v.icon,
            };
          })}
        />
        <FrameworkCard
          title="Core GPA"
          caption="Projected trajectory"
          items={[
            {
              rowKey: "gpa-improving",
              label: "Improving",
              count: summary.gpa.improving,
              band: "green",
              icon: CheckCircle,
            },
            {
              rowKey: "gpa-flat",
              label: "Flat",
              count: summary.gpa.flat,
              band: "yellow",
              icon: TrendingDown,
            },
            {
              rowKey: "gpa-declining",
              label: "Declining",
              count: summary.gpa.declining,
              band: "red",
              icon: AlertTriangle,
            },
          ]}
        />
        <FrameworkCard
          title="Mental Health / AIMS"
          caption="Identity and SEL escalation"
          items={[
            {
              rowKey: "aims-stable",
              label: "Stable",
              count: summary.aims.STABLE,
              band: "green",
              icon: CheckCircle,
            },
            {
              rowKey: "aims-escalated",
              label: "Elevated watch",
              count: summary.aims.ESCALATED,
              band: "yellow",
              icon: TrendingDown,
            },
            {
              rowKey: "aims-high",
              label: "High concern",
              count: summary.aims.HIGH,
              band: "escalation",
              icon: AlertTriangle,
            },
          ]}
        />
      </div>
    </Card>
  );
}

function FrameworkCard({
  title,
  caption,
  items,
}: {
  title: string;
  caption: string;
  items: Array<{
    rowKey: string;
    label: string;
    count: number;
    band: BandKey;
    icon: LucideIcon;
  }>;
}) {
  return (
    <div className="rounded bg-surface-inner p-4">
      <div className="font-serif text-[16px] leading-tight text-text-primary">{title}</div>
      <div className="mt-1 font-sans text-[11px] text-text-tertiary">{caption}</div>
      <div className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.rowKey} className="flex items-center justify-between gap-3">
            <Badge band={item.band} size="sm" icon={item.icon}>
              {item.label}
            </Badge>
            <span className="font-mono text-[18px] font-medium text-text-primary">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HolisticKpiGrid;

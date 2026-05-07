import * as React from "react";
import {
  AlertTriangle,
  CheckCircle,
  GitBranch,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { BandKey } from "@/components/ui/Badge";
import type { HolisticStudentRisk } from "@/lib/calculations/holistic-rollup";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";

export function HolisticHealthStrip({ holistic }: { holistic: HolisticStudentRisk }) {
  return (
    <Card variant="inner" padding="md" className="rounded">
      <div className="grid gap-3 desktop:grid-cols-4 tablet:grid-cols-2 mobile:grid-cols-1">
        <MiniStat
          label="NCAA 10/7"
          value={labelForRiskBand(holistic.tenSevenStatus)}
          band={bandForStatus(holistic.tenSevenStatus)}
        />
        <MiniStat
          label="California A-G"
          value={labelForRiskBand(holistic.agStatus)}
          band={bandForStatus(holistic.agStatus)}
        />
        <MiniStat
          label="Core GPA"
          value={`${holistic.projectedCoreGpa.toFixed(1)} · ${labelForTrajectory(holistic.gpaTrajectory)}`}
          band={bandForTrajectory(holistic.gpaTrajectory)}
        />
        <MiniStat
          label="AIMS / SEL"
          value={labelForAims(holistic.aimsRisk)}
          band={bandForAims(holistic.aimsRisk)}
        />
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  band,
}: {
  label: string;
  value: string;
  band: BandKey;
}) {
  const icon = iconForBand(band);
  return (
    <div className="flex items-center justify-between gap-3 rounded bg-surface-card px-3 py-2 shadow-sm">
      <span className="font-sans text-[11px] font-medium text-text-tertiary">{label}</span>
      <Badge band={band} size="sm" icon={icon}>
        {value}
      </Badge>
    </div>
  );
}

function iconForBand(band: string): LucideIcon {
  if (band === "green") return CheckCircle;
  if (band === "yellow") return TrendingDown;
  if (band === "red" || band === "escalation") return AlertTriangle;
  return GitBranch;
}

function labelForRiskBand(status: string): string {
  if (status === "GREEN" || status === "YELLOW" || status === "RED" || status === "LOCKED") {
    return RISK_VOCABULARY[status].label;
  }
  return "Not Applicable";
}

function bandForStatus(status: string): BandKey {
  if (status === "GREEN" || status === "YELLOW" || status === "RED" || status === "LOCKED") {
    return RISK_VOCABULARY[status].band;
  }
  return "locked";
}

function labelForTrajectory(trajectory: string): string {
  if (trajectory === "improving") return "Improving";
  if (trajectory === "flat") return "Flat";
  return "Declining";
}

function bandForTrajectory(trajectory: string): BandKey {
  if (trajectory === "improving") return "green";
  if (trajectory === "flat") return "yellow";
  return "red";
}

function labelForAims(aims: string): string {
  if (aims === "STABLE") return "Stable";
  if (aims === "ESCALATED") return "Elevated watch";
  return "High concern";
}

function bandForAims(aims: string): BandKey {
  if (aims === "STABLE") return "green";
  if (aims === "ESCALATED") return "yellow";
  return "escalation";
}

export default HolisticHealthStrip;

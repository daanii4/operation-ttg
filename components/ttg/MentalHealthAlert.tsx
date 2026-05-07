"use client";
import * as React from "react";
import { AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { HolisticStudentRisk } from "@/lib/calculations/holistic-rollup";

export function MentalHealthAlert({ holistic }: { holistic: HolisticStudentRisk }) {
  const [acknowledged, setAcknowledged] = React.useState(false);
  if (holistic.aimsRisk === "STABLE") return null;

  return (
    <Card variant="alert-red" padding="lg" className="rounded">
      <div className="flex items-start justify-between gap-4 mobile:flex-col">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-escalation" />
          <div>
            <h2 className="font-sans text-[14px] font-bold uppercase tracking-[0.06em] text-escalation">
              AIMS / Mental Health Escalation
            </h2>
            <p className="mt-2 font-sans text-[13px] leading-[1.5] text-text-secondary">
              {holistic.aimsReason ??
                "AIMS risk is elevated. Complete a trauma-informed SEL check-in before academic pathway planning."}
            </p>
            <p className="mt-2 font-mono text-[11px] text-text-tertiary">
              Advisor action: {holistic.recommendedAdvisorAction}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={acknowledged ? "ghost" : "primary"}
          onClick={() => setAcknowledged(true)}
        >
          {acknowledged ? "SEL check-in acknowledged" : "Acknowledge SEL check-in"}
        </Button>
      </div>
    </Card>
  );
}

export default MentalHealthAlert;

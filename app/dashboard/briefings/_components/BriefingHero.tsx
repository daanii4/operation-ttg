"use client";

import * as React from "react";
import { BandBadge } from "@/components/ui/qn";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { escalationLabel } from "@/lib/calculations/escalation-labels";
import type { CompositeBand, F12Result, F8Result } from "@/lib/calculations/types";
import { formatTargetDivision } from "@/app/students/[id]/profile-utils";

export interface BriefingHeroProps {
  student: QnRosterRow;
  f12: F12Result;
  f8?: F8Result;
  updatedRelative?: string;
  embedded?: boolean;
}

export function BriefingHero({
  student,
  f12,
  f8,
  updatedRelative,
  embedded = false,
}: BriefingHeroProps) {
  const band = f12.composite_band as CompositeBand;
  const vocabulary = RISK_VOCABULARY[band];
  const weeks = f12.weeks_to_critical_action;
  const concern = escalationLabel(f12.primary_concern ?? f8?.primary_concern ?? null);
  const division = formatTargetDivision(student.targetDivision);

  return (
    <section
      className="mx-auto max-w-[960px] px-6"
      style={{
        paddingTop: embedded ? 20 : 24,
        paddingBottom: 20,
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1
            className="font-serif"
            style={{
              fontSize: 24,
              lineHeight: "32px",
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {student.fullName}
          </h1>
          <p className="mt-1 font-sans text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            {student.sport} · {division} · Class of {student.graduationYear}
          </p>
        </div>
        {updatedRelative ? (
          <p
            className="shrink-0 font-mono text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Updated {updatedRelative}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <BandBadge band={band} labelOverride={vocabulary.label} />
        {weeks === 0 ? (
          <span className="font-sans text-[13px] font-semibold" style={{ color: "var(--status-urgent)" }}>
            Immediate action required
          </span>
        ) : weeks != null ? (
          <span
            className="font-mono text-[13px] font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            ~{weeks} weeks to critical action
          </span>
        ) : null}
      </div>

      {concern && concern !== "—" ? (
        <p className="mt-3 font-sans text-[14px] leading-5" style={{ color: "var(--text-primary)" }}>
          {concern}
        </p>
      ) : null}
    </section>
  );
}

export default BriefingHero;

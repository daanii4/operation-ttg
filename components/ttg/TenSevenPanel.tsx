"use client";
import * as React from "react";
import Card from "@/components/ui/Card";
import Badge, { BandKey } from "@/components/ui/Badge";
import Link from "@/components/ui/Link";
import { RISK_VOCABULARY } from "./risk-vocabulary";

type Band = "GREEN" | "YELLOW" | "RED" | "LOCKED";

type Props = {
  riskBand: Band;
  riskBandExplanation: string;
  daysToLock: number | "Past lock";
  lockInDate: string;
  cores: { completed: number; required: number; missing: number };
  emsSubset: { completed: number; required: number; missing: number };
  provisionalFlag: boolean;
  onOpenDerivation: (
    field: "daysToLock" | "cores" | "emsSubset" | "riskBand"
  ) => void;
};

const BAND_TOKEN: Record<Band, string> = {
  GREEN: "var(--band-track)",
  YELLOW: "var(--band-support)",
  RED: "var(--band-urgent)",
  LOCKED: "var(--band-pivot)",
};

const BAND_KEY: Record<Band, BandKey> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  LOCKED: "locked",
};

export function TenSevenPanel({
  riskBand,
  riskBandExplanation,
  daysToLock,
  lockInDate,
  cores,
  emsSubset,
  provisionalFlag,
  onOpenDerivation,
}: Props) {
  const bandColor = BAND_TOKEN[riskBand];
  const vocabulary = RISK_VOCABULARY[riskBand];
  const isPastLock = daysToLock === "Past lock";

  return (
    <Card variant="default" padding="lg">
      {/* Header */}
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
          NCAA D1 10/7 Core Course Status
        </h2>
        <Badge band={BAND_KEY[riskBand]} size="md" icon={vocabulary.icon}>
          {vocabulary.label}
        </Badge>
      </div>

      {/* Three-column stat grid */}
      <Card variant="inner" padding="lg" className="rounded">
        <div className="grid grid-cols-3 gap-6 mobile:gap-3">
          {/* Days to Lock */}
          <StatColumn
            onTrigger={() => onOpenDerivation("daysToLock")}
            label="Days to lock"
            sublabel={`Lock date: ${lockInDate}`}
          >
            <button
              type="button"
              onClick={() => onOpenDerivation("daysToLock")}
              className="font-mono font-medium leading-none focus-ring-gold rounded-sm hover:underline hover:[text-decoration-thickness:2px] hover:[text-underline-offset:6px] hover:[text-decoration-color:var(--gold-500)]"
              style={{
                color: bandColor,
                fontSize: isPastLock ? 32 : 56,
                letterSpacing: "-0.02em",
              }}
            >
              {provisionalFlag && !isPastLock ? "~" : ""}
              {isPastLock ? "Past lock" : daysToLock}
            </button>
          </StatColumn>

          {/* Cores */}
          <StatColumn
            onTrigger={() => onOpenDerivation("cores")}
            label="Cores complete"
            sublabel={
              cores.missing > 0 ? (
                <span className="text-band-red">−{cores.missing} still needed</span>
              ) : (
                <span className="invisible">placeholder</span>
              )
            }
          >
            <button
              type="button"
              onClick={() => onOpenDerivation("cores")}
              className="font-mono font-normal leading-none focus-ring-gold rounded-sm hover:underline hover:[text-decoration-thickness:2px] hover:[text-underline-offset:6px] hover:[text-decoration-color:var(--gold-500)]"
              style={{ fontSize: 48, letterSpacing: "-0.01em" }}
            >
              <span className="text-text-primary">{cores.completed}</span>
              <span className="text-text-tertiary/60"> / {cores.required}</span>
            </button>
          </StatColumn>

          {/* EMS subset */}
          <StatColumn
            onTrigger={() => onOpenDerivation("emsSubset")}
            label="Eng / Math / Sci subset"
            sublabel={
              emsSubset.missing > 0 ? (
                <span className="text-band-yellow">−{emsSubset.missing} still needed</span>
              ) : emsSubset.completed > emsSubset.required ? (
                <span className="text-band-green">
                  +{emsSubset.completed - emsSubset.required} surplus
                </span>
              ) : (
                <span className="text-band-green">On pace</span>
              )
            }
          >
            <button
              type="button"
              onClick={() => onOpenDerivation("emsSubset")}
              className="font-mono font-normal leading-none focus-ring-gold rounded-sm hover:underline hover:[text-decoration-thickness:2px] hover:[text-underline-offset:6px] hover:[text-decoration-color:var(--gold-500)]"
              style={{ fontSize: 48, letterSpacing: "-0.01em" }}
            >
              <span style={{ color: emsSubset.missing > 0 ? "var(--band-yellow)" : "var(--band-green)" }}>
                {emsSubset.completed}
              </span>
              <span className="text-text-tertiary/60"> / {emsSubset.required}</span>
            </button>
          </StatColumn>
        </div>
      </Card>

      {/* Risk band narrative bar */}
      <button
        type="button"
        onClick={() => onOpenDerivation("riskBand")}
        className="mt-5 flex w-full items-center gap-3 rounded px-4 py-3 text-left transition-colors duration-150 ease-out hover:brightness-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          background: `var(--band-${BAND_KEY[riskBand]}-fill)`,
          border: `1px solid var(--band-${BAND_KEY[riskBand]}-border)`,
          outlineColor: bandColor,
        }}
      >
        <span
          className="font-sans text-[13px] font-bold uppercase tracking-[0.06em]"
          style={{ color: bandColor }}
        >
          {riskBand}
        </span>
        <span className="text-text-secondary">·</span>
        <span className="font-sans text-[13px] text-text-secondary">
          {riskBandExplanation}
        </span>
      </button>
    </Card>
  );
}

function StatColumn({
  children,
  label,
  sublabel,
  onTrigger,
}: {
  children: React.ReactNode;
  label: string;
  sublabel: React.ReactNode;
  onTrigger: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div>{children}</div>
      <Link href="#" onClick={(e) => { e.preventDefault(); onTrigger(); }} icon="info" className="text-[11px]">
        How is this computed?
      </Link>
      <div className="mt-2 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
        {label}
      </div>
      <div className="font-mono text-[11px] text-text-tertiary">{sublabel}</div>
    </div>
  );
}

export default TenSevenPanel;

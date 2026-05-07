import * as React from "react";
import Card from "@/components/ui/Card";
import Badge, { BandKey } from "@/components/ui/Badge";
import { RISK_VOCABULARY } from "./risk-vocabulary";

type IdentityHeaderProps = {
  firstName: string;
  lastName: string;
  grade: number;
  sport: string;
  highSchool: string;
  targetDivision: string;
  riskBand: "GREEN" | "YELLOW" | "RED" | "LOCKED" | "NOT_APPLICABLE";
};

const BAND_KEY: Record<string, BandKey> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  LOCKED: "locked",
};

export function IdentityHeader({
  firstName,
  lastName,
  grade,
  sport,
  highSchool,
  targetDivision,
  riskBand,
}: IdentityHeaderProps) {
  const fullName = `${firstName} ${lastName}`;
  const nameSize = fullName.length <= 18 ? "text-[28px]" : "text-[22px]";
  const vocabulary = riskBand !== "NOT_APPLICABLE" ? RISK_VOCABULARY[riskBand] : null;

  return (
    <Card variant="inverse" padding="none" radius="xl" className="relative overflow-hidden">
      {/* Gold left bar */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gold-500" />
      {/* Decorative circles */}
      <svg
        className="pointer-events-none absolute"
        style={{ right: -80, bottom: -100, width: 280, height: 280 }}
        aria-hidden
      >
        <circle cx={140} cy={140} r={140} fill="rgba(255,255,255,0.04)" />
      </svg>
      <svg
        className="pointer-events-none absolute"
        style={{ right: 40, bottom: -60, width: 180, height: 180 }}
        aria-hidden
      >
        <circle cx={90} cy={90} r={90} fill="rgba(255,255,255,0.04)" />
      </svg>

      <div className="relative z-10 flex items-start justify-between gap-4 px-9 py-8 mobile:flex-col mobile:px-6 mobile:py-5">
        <div className="flex flex-col gap-2">
          <h1
            className={[
              "font-serif leading-[1.15] tracking-[-0.01em] text-white",
              nameSize,
            ].join(" ")}
          >
            {fullName}
          </h1>
          <div className="font-sans text-[12px] text-white/60">
            <span>Grade {grade}</span>
            <span className="mx-2">·</span>
            <span>{sport}</span>
            <span className="mx-2">·</span>
            <span>{highSchool}</span>
            <span className="mx-2">·</span>
            <span>{targetDivision} Target</span>
          </div>
        </div>
        {riskBand !== "NOT_APPLICABLE" && vocabulary && (
          <Badge variant="inverse" band={BAND_KEY[riskBand]} icon={vocabulary.icon}>
            {vocabulary.label}
          </Badge>
        )}
      </div>
    </Card>
  );
}

export default IdentityHeader;

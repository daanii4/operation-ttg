"use client";

/**
 * Sprint 7 / Workstream ML-6 — Risk Forecast card.
 *
 * Renders the latest MlTrajectoryScore for the selected student. Three
 * non-negotiable affordances per spec:
 *   1. The score is rendered as a percentage in IBM Plex Mono.
 *   2. The CI bar visualizes [confidence_lower, confidence_upper] on a
 *      0–100% scale so advisors see the model's uncertainty at a glance.
 *   3. The disclaimer below is *always visible* — not collapsible, not
 *      dismissable — because v0.1 is trained on synthetic data and the
 *      score is advisory only. F8 remains the authoritative eligibility
 *      signal.
 */

import * as React from "react";
import { mlRiskTierLabel } from "@/lib/calculations/display-labels";

interface MlScore {
  score: number;
  confidence_lower: number;
  confidence_upper: number;
  risk_tier: "low" | "moderate" | "high";
  model_version: string;
  computed_at: string;
}

const TONE: Record<MlScore["risk_tier"], { fg: string; bg: string }> = {
  low: { fg: "var(--color-green)", bg: "var(--color-green-tint)" },
  moderate: { fg: "var(--color-yellow)", bg: "var(--color-yellow-tint)" },
  high: { fg: "var(--color-red)", bg: "var(--color-red-tint)" },
};

export interface RiskForecastCardProps {
  ml: MlScore | null | undefined;
}

export function RiskForecastCard({ ml }: RiskForecastCardProps) {
  return (
    <section
      aria-labelledby="risk-forecast-heading"
      style={{
        padding: 20,
        background: "var(--color-bg)",
        borderRadius: 8,
        border: "1px solid var(--color-border)",
      }}
    >
      <header className="flex items-baseline justify-between">
        <h3
          id="risk-forecast-heading"
          className="text-base font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          Risk Forecast
        </h3>
        <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
          {ml ? `Model: ${ml.model_version}` : "Model: logistic-v0.1"}
        </span>
      </header>

      {ml ? <ScoreView ml={ml} /> : <EmptyView />}

      <Disclaimer />
    </section>
  );
}

function ScoreView({ ml }: { ml: MlScore }) {
  const tone = TONE[ml.risk_tier];
  const pct = (ml.score * 100).toFixed(0);
  const lowerPct = (ml.confidence_lower * 100).toFixed(0);
  const upperPct = (ml.confidence_upper * 100).toFixed(0);

  return (
    <div className="mt-4">
      <div className="flex items-baseline gap-3">
        <span
          aria-label={`Eligibility risk score ${pct}% (${ml.risk_tier} risk tier)`}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 36,
            lineHeight: "44px",
            fontWeight: 500,
            color: tone.fg,
          }}
        >
          {pct}%
        </span>
        <span
          className="inline-flex items-center rounded-full"
          style={{
            padding: "4px 10px",
            background: tone.bg,
            color: tone.fg,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {mlRiskTierLabel(ml.risk_tier)}
        </span>
      </div>

      <CiBar
        score={ml.score}
        lower={ml.confidence_lower}
        upper={ml.confidence_upper}
        color={tone.fg}
      />

      <div
        className="mt-1 flex items-baseline justify-between"
        style={{ fontSize: 11, color: "var(--color-muted)" }}
      >
        <span>
          95% CI: {lowerPct}% – {upperPct}%
        </span>
        <span>
          Updated{" "}
          {new Date(ml.computed_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

function CiBar({
  score,
  lower,
  upper,
  color,
}: {
  score: number;
  lower: number;
  upper: number;
  color: string;
}) {
  const lowerPct = Math.max(0, Math.min(1, lower)) * 100;
  const upperPct = Math.max(0, Math.min(1, upper)) * 100;
  const scorePct = Math.max(0, Math.min(1, score)) * 100;

  return (
    <div
      role="meter"
      aria-label={`Confidence interval ${lowerPct.toFixed(0)} to ${upperPct.toFixed(0)} percent`}
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={1}
      className="mt-3"
      style={{
        position: "relative",
        height: 10,
        borderRadius: 5,
        background: "var(--color-row-alt)",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: `${lowerPct}%`,
          width: `${Math.max(0, upperPct - lowerPct)}%`,
          top: 0,
          bottom: 0,
          borderRadius: 5,
          background: color,
          opacity: 0.35,
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: `calc(${scorePct}% - 1px)`,
          top: -3,
          bottom: -3,
          width: 2,
          background: color,
        }}
      />
    </div>
  );
}

function EmptyView() {
  return (
    <p
      role="status"
      style={{
        marginTop: 12,
        padding: "16px 12px",
        background: "var(--color-row-alt)",
        borderRadius: 6,
        fontSize: 13,
        color: "var(--color-muted)",
        textAlign: "center",
      }}
    >
      Risk forecast not yet computed for this student.
    </p>
  );
}

function Disclaimer() {
  return (
    <div
      role="note"
      // The disclaimer is part of the contract — visible on every render,
      // not collapsible. See ML-6 acceptance gate.
      style={{
        marginTop: 16,
        padding: "10px 12px",
        background: "var(--color-yellow-tint)",
        border: "1px solid #FDE68A",
        borderRadius: 6,
        fontSize: 11,
        lineHeight: "16px",
        color: "#92400E",
      }}
    >
      This score is a statistical estimate based on synthetic training data.
      It is advisory only and does not override the eligibility determination
      above. Treat all v0.1 scores as Provisional.
    </div>
  );
}

export default RiskForecastCard;

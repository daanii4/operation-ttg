"use client";

/**
 * QuasarNova v1 — §4.3 Section C (Layer summary table).
 *
 * Four rows: Eligibility / GPA Trajectory / AIMS / Engagement.
 * Headers in 11/600 uppercase muted; signal column in IBM Plex Mono;
 * row height 40px; bottom borders only (no vertical lines).
 *
 * The "—" placeholder is used for any cell whose evidence tier is
 * Insufficient (per §9 partial-data rules). The cell carries
 * title="Insufficient evidence" so screen-readers + hover both communicate.
 */

import * as React from "react";
import { BandBadge, type Band } from "@/components/ui/qn";
import type {
  BriefingPayload,
} from "./use-briefing-data";
import {
  aimsFlagLabel,
  aimsRiskLabel,
  engagementTrendLabel,
  trajectoryDirectionLabel,
} from "@/lib/calculations/display-labels";
import { escalationLabel } from "@/lib/calculations/escalation-labels";

interface LayerRow {
  layer: string;
  band: Band | null;
  signal: string;
  notes: string;
  insufficient?: boolean;
}

function eligibilityRow(p: BriefingPayload): LayerRow {
  if (!p.f8) return { layer: "Eligibility", band: null, signal: "—", notes: "—", insufficient: true };
  const layerBand = p.f12?.layer_summary.eligibility.band;
  const band: Band =
    layerBand === "RED" || layerBand === "ESCALATED"
      ? "RED"
      : layerBand === "YELLOW"
        ? "YELLOW"
        : "GREEN";
  return {
    layer: "Eligibility",
    band,
    signal: p.f8.composite_band,
    notes:
      p.f12?.layer_summary.eligibility.flag
        ? escalationLabel(p.f12.layer_summary.eligibility.flag)
        : p.f8.is_on_track
          ? "On track"
          : escalationLabel(p.f8.primary_concern),
  };
}

function gpaRow(p: BriefingPayload): LayerRow {
  if (!p.f9 || p.f9.evidence_tier === "Insufficient") {
    return {
      layer: "GPA Trajectory",
      band: null,
      signal: "—",
      notes: p.f9?.insufficient_reason ?? "Not enough recent grade data",
      insufficient: true,
    };
  }
  const dir = p.f9.direction ?? "flat_or_uncertain";
  const band: Band =
    p.f9.regression_flag || dir === "declining"
      ? "RED"
      : dir === "improving"
        ? "GREEN"
        : "YELLOW";
  const slope = p.f9.slope != null ? p.f9.slope.toFixed(2) : "—";
  const sign = p.f9.slope != null && p.f9.slope < 0 ? "↓" : p.f9.slope != null && p.f9.slope > 0 ? "↑" : "→";
  return {
    layer: "GPA Trajectory",
    band,
    signal: `${sign}${slope}`,
    notes: p.f9.regression_flag
      ? "Regression flagged"
      : `Direction · ${trajectoryDirectionLabel(p.f9.direction)}`,
  };
}

function aimsRow(p: BriefingPayload): LayerRow {
  if (!p.f10 || p.f10.evidence_tier === "Insufficient") {
    return {
      layer: "AIMS",
      band: null,
      signal: "—",
      notes: p.f10?.insufficient_reason ?? "Awaiting next AIMS administration",
      insufficient: true,
    };
  }
  const band: Band =
    p.f10.risk_band === "High"
      ? "RED"
      : p.f10.risk_band === "Moderate"
        ? "YELLOW"
        : "GREEN";
  const score = p.f10.total_score_current != null ? p.f10.total_score_current.toFixed(1) : "—";
  return {
    layer: "AIMS",
    band,
    signal: score,
    notes:
      p.f10.cross_layer_flags.length > 0
        ? p.f10.cross_layer_flags.map(aimsFlagLabel).join(" · ")
        : aimsRiskLabel(p.f10.risk_band),
  };
}

function engagementRow(p: BriefingPayload): LayerRow {
  if (!p.f11 || p.f11.evidence_tier === "Insufficient") {
    return {
      layer: "Engagement",
      band: null,
      signal: "—",
      notes: p.f11?.insufficient_reason ?? "Not enough recent observations",
      insufficient: true,
    };
  }
  const band: Band = p.f11.withdrawal_flag
    ? "RED"
    : p.f11.low_engagement_flag
      ? "YELLOW"
      : "GREEN";
  const avg = p.f11.window_avg != null ? p.f11.window_avg.toFixed(2) : "—";
  return {
    layer: "Engagement",
    band,
    signal: avg,
    notes: p.f11.withdrawal_flag
      ? `Withdrawal · ${p.f11.consecutive_absences} absences`
      : `Trend · ${engagementTrendLabel(p.f11.trend)}`,
  };
}

export interface LayerSummaryProps {
  payload: BriefingPayload;
}

export function LayerSummary({ payload }: LayerSummaryProps) {
  const rows: LayerRow[] = [
    eligibilityRow(payload),
    gpaRow(payload),
    aimsRow(payload),
    engagementRow(payload),
  ];

  return (
    <section className="px-6 py-5">
      <p
        className="text-[11px] font-semibold uppercase"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
      >
        Layer summary
      </p>

      <table
        className="mt-3 w-full"
        style={{ borderCollapse: "collapse", tableLayout: "fixed" }}
      >
        <thead>
          <tr>
            <Th width="32%">Layer</Th>
            <Th width="20%">Status</Th>
            <Th width="18%">Signal</Th>
            <Th width="30%">Notes</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.layer}
              style={{ borderBottom: "1px solid var(--border-default)", height: 40 }}
            >
              <td
                style={{
                  fontSize: 13,
                  lineHeight: "20px",
                  color: "var(--text-primary)",
                  paddingRight: 12,
                }}
              >
                {row.layer}
              </td>
              <td>
                {row.band ? (
                  <BandBadge band={row.band} />
                ) : (
                  <span
                    title="Insufficient evidence"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    —
                  </span>
                )}
              </td>
              <td
                className="font-mono"
                style={{
                  fontSize: 13,
                  lineHeight: "20px",
                  color: row.insufficient ? "var(--text-tertiary)" : "var(--text-primary)",
                }}
                title={row.insufficient ? "Insufficient evidence" : undefined}
              >
                {row.signal}
              </td>
              <td
                style={{
                  fontSize: 13,
                  lineHeight: "20px",
                  color: "var(--text-tertiary)",
                  paddingRight: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={row.notes}
              >
                {row.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Th({ children, width }: { children: React.ReactNode; width: string }) {
  return (
    <th
      scope="col"
      style={{
        textAlign: "left",
        fontSize: 11,
        lineHeight: "16px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
        borderBottom: "1px solid var(--border-default)",
        padding: "8px 12px 8px 0",
        width,
      }}
    >
      {children}
    </th>
  );
}

export default LayerSummary;

"use client";

/**
 * QuasarNova v1 — §4.3 Section D (Evidence tier footer).
 *
 * Subtle tonal cap on the briefing card. Left: worst evidence tier across all
 * layers. Right: muted "Last refreshed {time} · Briefing ID {id}".
 */

import * as React from "react";
import { EvidenceTierChip } from "@/components/ui/qn";
import { selectWorstTier, tierToChipBucket, type BriefingPayload } from "./use-briefing-data";

function formatRelative(date: Date): string {
  return date.toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export interface EvidenceFooterProps {
  payload: BriefingPayload;
  computedAt: Date | null;
}

export function EvidenceFooter({ payload, computedAt }: EvidenceFooterProps) {
  const worst = selectWorstTier(payload);
  const tier = tierToChipBucket(worst);
  const briefingVersion = payload.f12?.briefing_version ?? "—";

  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-2"
      style={{
        padding: "16px 28px",
        background: "var(--surface-inner)",
      }}
    >
      <EvidenceTierChip tier={tier} />
      <p
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
        }}
      >
        Last refreshed {computedAt ? formatRelative(computedAt) : "—"} · Briefing v{briefingVersion}
      </p>
    </footer>
  );
}

export default EvidenceFooter;

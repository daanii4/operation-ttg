"use client";

import * as React from "react";
import { EvidenceTierChip } from "@/components/ui/qn";
import { selectWorstTier, tierToChipBucket, type BriefingPayload } from "./use-briefing-data";

const TIER_DISPLAY: Record<"Deterministic" | "Provisional" | "Insufficient", string> = {
  Deterministic: "Verified",
  Provisional: "Provisional",
  Insufficient: "Insufficient",
};

export interface EvidenceFooterProps {
  payload: BriefingPayload;
  computedAt: Date | null;
}

export function EvidenceFooter({ payload, computedAt }: EvidenceFooterProps) {
  const worst = selectWorstTier(payload);
  const tier = tierToChipBucket(worst);
  const briefingVersion = payload.f12?.briefing_version ?? "—";
  const generatedAt = payload.f12?.generated_at
    ? new Date(payload.f12.generated_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : computedAt
      ? computedAt.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "—";

  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-3"
      style={{ paddingBottom: 16 }}
    >
      <EvidenceTierChip tier={tier} labelOverride={TIER_DISPLAY[tier]} />
      <p className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        {briefingVersion} · {generatedAt}
      </p>
    </footer>
  );
}

export default EvidenceFooter;

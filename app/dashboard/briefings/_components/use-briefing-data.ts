"use client";

import * as React from "react";
import type {
  EvidenceTier as F12EvidenceTier,
  F12Result,
  F8Result,
  F9Result,
  F10Result,
  F11Result,
  InterventionCode,
} from "@/lib/calculations/types";

export interface BriefingObservations {
  grades: Array<{ observed_grade: string; observed_at: string }>;
  engagement: Array<{ observed_at: string; engagement_type: string; value: number }>;
  aims: Array<{
    administered_at: string;
    social_identity_score: number;
    exclusivity_score: number;
    negative_affectivity_score: number;
    aims_version: string;
  }>;
}

export interface BriefingPayload {
  f8?: F8Result;
  f9?: F9Result;
  f10?: F10Result;
  f11?: F11Result;
  f12?: F12Result;
  computedAt?: string;
  observations?: BriefingObservations;
}

export type BriefingStatus = "idle" | "loading" | "ready" | "error" | "empty";

export interface UseBriefingResult {
  status: BriefingStatus;
  data: BriefingPayload | null;
  error: string | null;
  /** Fetched timestamp (used for the footer "Last refreshed" text). */
  computedAt: Date | null;
  /** Briefing version derived from F12 (or null). */
  briefingId: string | null;
  /** Re-fetch helper bound to the current student id. */
  refetch: () => void;
}

/**
 * Loads the F8/F9/F10/F11/F12 briefing slice for a single student. The
 * eligibility API already returns this bundle; the hook just trims it down
 * and tracks state for the UI. Returns "empty" when the API responds OK but
 * F12 is missing — the spec wants a distinct copy for that branch.
 */
export function useBriefingData(studentId: string | null): UseBriefingResult {
  const [data, setData] = React.useState<BriefingPayload | null>(null);
  const [status, setStatus] = React.useState<BriefingStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!studentId) {
      setData(null);
      setStatus("idle");
      setError(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/students/${studentId}/eligibility`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Briefing request failed (${res.status})`);
        }
        const json = (await res.json()) as BriefingPayload;
        if (cancelled) return;
        if (!json.f12) {
          setData(json);
          setStatus("empty");
          return;
        }
        setData(json);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId, tick]);

  const computedAt = data?.computedAt ? new Date(data.computedAt) : null;
  const briefingId = data?.f12 ? data.f12.briefing_version : null;

  const refetch = React.useCallback(() => setTick((t) => t + 1), []);

  return { status, data, error, computedAt, briefingId, refetch };
}

/* -------------------------------------------------------------------------- */
/* Selectors used by the card sub-components                                   */
/* -------------------------------------------------------------------------- */

export interface InterventionRow {
  code: InterventionCode;
  label: string;
  priority: "red" | "amber" | "green";
}

export const INTERVENTION_DESCRIPTIONS: Record<InterventionCode, string> = {
  IMMEDIATE_ADVISOR_CONTACT: "Reach out today; flagged for immediate intervention.",
  SCHEDULE_ACADEMIC_SUPPORT: "Schedule academic support / tutoring this week.",
  MONITOR_ENGAGEMENT: "Engagement pattern declining — keep eyes on it.",
  GPA_RECOVERY_PLAN: "Build a GPA recovery plan with the student.",
  AIMS_FOLLOW_UP: "Follow up on the most recent AIMS administration.",
  TRANSCRIPT_AUDIT: "Pull a fresh transcript; current data is insufficient.",
  D1_PATHWAY_REVIEW: "Review whether D1 remains a viable pathway.",
  NO_ACTION_REQUIRED: "On track; no intervention is currently required.",
};

const PRIORITY: Record<InterventionCode, "red" | "amber" | "green"> = {
  IMMEDIATE_ADVISOR_CONTACT: "red",
  D1_PATHWAY_REVIEW: "amber",
  GPA_RECOVERY_PLAN: "amber",
  AIMS_FOLLOW_UP: "amber",
  MONITOR_ENGAGEMENT: "amber",
  TRANSCRIPT_AUDIT: "amber",
  SCHEDULE_ACADEMIC_SUPPORT: "amber",
  NO_ACTION_REQUIRED: "green",
};

export function selectInterventionRows(f12: F12Result): InterventionRow[] {
  return f12.intervention_codes.map((code) => ({
    code,
    label: code.replace(/_/g, " "),
    priority: PRIORITY[code] ?? "amber",
  }));
}

/**
 * Per spec decision §9.5: footer reports the *worst* tier across all layers.
 * Insufficient < Provisional < Deterministic for "worst" purposes.
 */
const TIER_RANK: Record<string, number> = {
  Insufficient: 0,
  Weak: 1,
  Moderate: 2,
  Provisional: 3,
  Strong: 4,
  Deterministic: 5,
  Not_Applicable: 6,
};

export function selectWorstTier(payload: BriefingPayload): F12EvidenceTier {
  const tiers: Array<F12EvidenceTier | undefined> = [
    payload.f9?.evidence_tier,
    payload.f10?.evidence_tier,
    payload.f11?.evidence_tier,
    payload.f8?.evidence_tier,
    payload.f12?.overall_evidence_tier,
  ];
  const present = tiers.filter((t): t is F12EvidenceTier => Boolean(t));
  if (present.length === 0) return "Insufficient";
  return present.reduce((acc, cur) =>
    (TIER_RANK[cur] ?? 99) < (TIER_RANK[acc] ?? 99) ? cur : acc
  );
}

/** Map an internal evidence tier to the v1 chip's three buckets. */
export function tierToChipBucket(
  tier: F12EvidenceTier
): "Deterministic" | "Provisional" | "Insufficient" {
  if (tier === "Deterministic" || tier === "Strong" || tier === "Not_Applicable") {
    return "Deterministic";
  }
  if (tier === "Insufficient") return "Insufficient";
  return "Provisional";
}

export function hasInsufficientEvidence(payload: BriefingPayload): boolean {
  return (
    payload.f9?.evidence_tier === "Insufficient" ||
    payload.f10?.evidence_tier === "Insufficient" ||
    payload.f11?.evidence_tier === "Insufficient"
  );
}

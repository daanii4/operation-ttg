/**
 * Sprint 7 / Workstream T-3 — calibrated threshold loader.
 *
 * `getThreshold(key, conference?)` reads the most-specific match first
 * (conference override beats global default). When the table hasn't been
 * seeded yet the loader throws — every consumer has a coded default that
 * matches the seed values, but they pass it explicitly via the
 * `BriefingThresholds` arg. This way the *only* way a threshold flows into
 * a calculation is via the database, never via a magic constant elsewhere.
 *
 * `getThresholdMap(keys, conference?)` is the bulk-fetch variant the API
 * route uses to grab all four thresholds in one round trip.
 */

import { prismaTtg } from "@/lib/prisma";

/** Canonical DB keys. Adding a new threshold? Add it here AND in prisma/seed/thresholds.ts. */
export const THRESHOLD_KEYS = {
  F11_LOW_ENGAGEMENT_CUTOFF: "f11.low_engagement_cutoff",
  F12_YELLOW_ACTION_WEEKS: "f12.yellow_action_weeks",
  F10_PCT_DELTA_THRESHOLD: "f10.pct_delta_threshold",
  ML_CONFIDENCE_MARGIN: "ml.confidence_margin",
} as const;

export type ThresholdKey = (typeof THRESHOLD_KEYS)[keyof typeof THRESHOLD_KEYS];

export class ThresholdNotFoundError extends Error {
  constructor(key: string) {
    super(
      `Threshold '${key}' not found in database. Run \`npm run seed:thresholds\`.`
    );
    this.name = "ThresholdNotFoundError";
  }
}

/**
 * Resolve a single threshold. Conference-specific value wins when present;
 * otherwise the global default (conference IS NULL).
 */
export async function getThreshold(
  key: string,
  conference?: string | null
): Promise<number> {
  const rows = await prismaTtg.thresholdConfig.findMany({
    where: {
      key,
      OR: conference
        ? [{ conference }, { conference: null }]
        : [{ conference: null }],
    },
  });

  if (rows.length === 0) {
    throw new ThresholdNotFoundError(key);
  }

  // Prefer the row whose conference matches the requested one.
  const conferenceMatch = conference
    ? rows.find((r) => r.conference === conference)
    : null;
  return (conferenceMatch ?? rows[0]!).value;
}

/**
 * Bulk fetch — used by the eligibility API route to grab all four thresholds
 * in a single DB round trip and pack them into a Required<BriefingThresholds>
 * object the calc layer consumes.
 *
 * Returns a Map<key, value>. Missing keys fall back to the in-code defaults
 * supplied by the caller; the API route then logs the miss + suggests a
 * `seed:thresholds` run rather than crashing the request.
 */
export async function getThresholdMap(
  keys: string[],
  conference?: string | null
): Promise<Map<string, number>> {
  const rows = await prismaTtg.thresholdConfig.findMany({
    where: {
      key: { in: keys },
      OR: conference
        ? [{ conference }, { conference: null }]
        : [{ conference: null }],
    },
  });

  const map = new Map<string, number>();
  // Two-pass: globals first, then conference-specific overrides.
  for (const row of rows) {
    if (row.conference == null) map.set(row.key, row.value);
  }
  if (conference) {
    for (const row of rows) {
      if (row.conference === conference) map.set(row.key, row.value);
    }
  }
  return map;
}

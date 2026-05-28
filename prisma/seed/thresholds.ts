/**
 * Sprint 7 / Workstream T-2 — seed default thresholds.
 *
 * Run with `npm run seed:thresholds`. The script is idempotent — it upserts
 * by (key, conference=null), so calling it repeatedly is safe and won't
 * overwrite conference-specific overrides set by owners.
 *
 * Adding a new threshold? Add it here AND register the key in
 * lib/config/thresholds.ts so the bulk loader picks it up.
 */

import { prismaTtg } from "@/lib/prisma";

export interface ThresholdSeed {
  key: string;
  value: number;
  description: string;
  ticket: string;
}

export const DEFAULT_THRESHOLDS: ThresholdSeed[] = [
  {
    key: "f11.low_engagement_cutoff",
    value: 0.4,
    description:
      "Minimum engagement window average below which low_engagement_flag fires",
    ticket: "THRESHOLD_PENDING_D5",
  },
  {
    key: "f12.yellow_action_weeks",
    value: 4,
    description: "Weeks assigned to YELLOW band for weeks_to_critical_action",
    ticket: "THRESHOLD_PENDING_AD5_CALIBRATION",
  },
  {
    key: "f10.pct_delta_threshold",
    value: 0.2,
    description: "AIMS within-subject percentage delta threshold",
    ticket: "THRESHOLD_PENDING_D3",
  },
  {
    key: "ml.confidence_margin",
    value: 0.12,
    description: "Bootstrap CI approximation margin for ML score v0.1",
    ticket: "THRESHOLD_PENDING_ML_V2",
  },
];

export async function seedThresholds(): Promise<{ upserted: number }> {
  let upserted = 0;
  for (const t of DEFAULT_THRESHOLDS) {
    // Prisma rejects nulls in composite-unique `where` (the @@unique([key, conference])
    // constraint allows multiple NULL conferences in Postgres). Use findFirst
    // then create-or-update so the seed stays idempotent.
    const existing = await prismaTtg.thresholdConfig.findFirst({
      where: { key: t.key, conference: null },
      select: { id: true },
    });
    if (existing) {
      await prismaTtg.thresholdConfig.update({
        where: { id: existing.id },
        data: {
          description: t.description,
          ticket: t.ticket,
        },
      });
    } else {
      await prismaTtg.thresholdConfig.create({
        data: {
          key: t.key,
          value: t.value,
          description: t.description,
          ticket: t.ticket,
          conference: null,
        },
      });
    }
    upserted += 1;
  }
  return { upserted };
}

if (require.main === module) {
  seedThresholds()
    .then((res) => {
      // eslint-disable-next-line no-console
      console.log(`[seed:thresholds] upserted ${res.upserted} rows`);
      return prismaTtg.$disconnect();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[seed:thresholds] failed", err);
      process.exit(1);
    });
}

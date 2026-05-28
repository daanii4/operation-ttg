-- Sprint 7 / Workstream T-1 — calibrated thresholds.
-- The (key, conference) pair is uniquely indexed so the same key can have
-- both a global default (conference IS NULL) and zero-or-more conference
-- overrides. lib/config/thresholds.getThreshold() reads the most-specific
-- match first.

CREATE TABLE IF NOT EXISTS "ttg"."threshold_configs" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "ticket" TEXT NOT NULL,
  "conference" TEXT,
  "calibrated_by" TEXT,
  "calibrated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "threshold_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "threshold_configs_key_conference_key"
  ON "ttg"."threshold_configs" ("key", "conference");

CREATE INDEX IF NOT EXISTS "threshold_configs_key_conference_idx"
  ON "ttg"."threshold_configs" ("key", "conference");

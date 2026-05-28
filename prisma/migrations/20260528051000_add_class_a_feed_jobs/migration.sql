-- Sprint 7 / Workstream A-1 — Class A verified data feed ingestion jobs.
-- The pipeline is gated by DATA_FEED_ENABLED=true at runtime; this migration
-- only provisions the persistence layer and is safe to apply before any
-- partnership API is wired.

CREATE TABLE IF NOT EXISTS "ttg"."class_a_feed_jobs" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "records_fetched" INTEGER,
  "records_written" INTEGER,
  "error" TEXT,
  "raw_payload" BYTEA,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "class_a_feed_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "class_a_feed_jobs_student_id_status_idx"
  ON "ttg"."class_a_feed_jobs" ("student_id", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'class_a_feed_jobs'
      AND constraint_name = 'class_a_feed_jobs_student_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."class_a_feed_jobs"
      ADD CONSTRAINT "class_a_feed_jobs_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "ttg"."StudentAthlete"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

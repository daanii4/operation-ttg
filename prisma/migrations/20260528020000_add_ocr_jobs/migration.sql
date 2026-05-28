-- Sprint 6 / Workstream B-1 — OCR transcript ingestion job state.
-- Status values are kept as a free-form string so the column accepts
-- 'pending' | 'processing' | 'needs_review' | 'accepted' | 'rejected'
-- plus the OCR-side error path 'failed' without requiring a follow-up
-- enum migration.

CREATE TABLE IF NOT EXISTS "ttg"."ocr_jobs" (
  "id" TEXT NOT NULL,
  "advisor_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "raw_text" TEXT,
  "parsed_courses" JSONB,
  "accepted_courses" JSONB,
  "confidence_scores" JSONB,
  "source_filename" TEXT,
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ocr_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ocr_jobs_advisor_id_status_idx"
  ON "ttg"."ocr_jobs" ("advisor_id", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'ocr_jobs'
      AND constraint_name = 'ocr_jobs_student_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."ocr_jobs"
      ADD CONSTRAINT "ocr_jobs_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "ttg"."StudentAthlete"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

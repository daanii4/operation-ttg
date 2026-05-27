-- Sprint 5: PDF export job state
-- See @repo/instructions: PDF generation is always async; jobs persist across
-- serverless invocations and the binary buffer is cleared after a 1 hour TTL.

CREATE TABLE IF NOT EXISTS "ttg"."pdf_export_jobs" (
  "id" TEXT NOT NULL,
  "advisor_id" TEXT NOT NULL,
  "job_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "student_id" TEXT,
  "error" TEXT,
  "pdf_buffer" BYTEA,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pdf_export_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pdf_export_jobs_advisor_id_status_idx"
  ON "ttg"."pdf_export_jobs" ("advisor_id", "status");

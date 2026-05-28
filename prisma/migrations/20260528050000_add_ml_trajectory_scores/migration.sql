-- Sprint 7 / Workstream ML-1 — per-student trajectory scores.

CREATE TABLE IF NOT EXISTS "ttg"."ml_trajectory_scores" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "confidence_lower" DOUBLE PRECISION NOT NULL,
  "confidence_upper" DOUBLE PRECISION NOT NULL,
  "feature_vector" JSONB NOT NULL,
  "model_version" TEXT NOT NULL,
  "risk_tier" TEXT NOT NULL,
  "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ml_trajectory_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ml_trajectory_scores_student_id_computed_at_idx"
  ON "ttg"."ml_trajectory_scores" ("student_id", "computed_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'ml_trajectory_scores'
      AND constraint_name = 'ml_trajectory_scores_student_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."ml_trajectory_scores"
      ADD CONSTRAINT "ml_trajectory_scores_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "ttg"."StudentAthlete"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

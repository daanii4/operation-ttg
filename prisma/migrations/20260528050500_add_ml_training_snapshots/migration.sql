-- Sprint 7 / Workstream ML-1 — model training snapshots (offline training input).

CREATE TABLE IF NOT EXISTS "ttg"."ml_training_snapshots" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "feature_vector" JSONB NOT NULL,
  "outcome" BOOLEAN NOT NULL,
  "snapshot_date" TIMESTAMP(3) NOT NULL,
  "model_version" TEXT NOT NULL,
  "data_class" TEXT NOT NULL,
  CONSTRAINT "ml_training_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ml_training_snapshots_model_version_idx"
  ON "ttg"."ml_training_snapshots" ("model_version");

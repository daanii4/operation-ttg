CREATE TABLE IF NOT EXISTS "ttg"."engagement_observations" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "observed_at" TIMESTAMP(3) NOT NULL,
  "engagement_type" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "raw_value" TEXT,
  "context" TEXT,
  "data_source_class" TEXT NOT NULL,
  "advisor_id" TEXT NOT NULL,
  CONSTRAINT "engagement_observations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "engagement_observations_student_id_observed_at_idx"
  ON "ttg"."engagement_observations"("student_id", "observed_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'engagement_observations'
      AND constraint_name = 'engagement_observations_student_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."engagement_observations"
      ADD CONSTRAINT "engagement_observations_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "ttg"."StudentAthlete"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ttg"."aims_assessments" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "social_identity_score" DOUBLE PRECISION NOT NULL,
  "exclusivity_score" DOUBLE PRECISION NOT NULL,
  "negative_affectivity_score" DOUBLE PRECISION NOT NULL,
  "administered_at" TIMESTAMP(3) NOT NULL,
  "aims_version" TEXT NOT NULL,
  "data_source_class" TEXT NOT NULL,
  CONSTRAINT "aims_assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aims_assessments_student_id_administered_at_idx"
  ON "ttg"."aims_assessments"("student_id", "administered_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'aims_assessments'
      AND constraint_name = 'aims_assessments_student_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."aims_assessments"
      ADD CONSTRAINT "aims_assessments_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "ttg"."StudentAthlete"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

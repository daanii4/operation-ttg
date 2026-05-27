-- F8: stateful acknowledgment store (AD-7)
CREATE TABLE IF NOT EXISTS "ttg"."composite_band_acknowledgments" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "advisor_id" TEXT NOT NULL,
  "band_transition" TEXT NOT NULL,
  "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cryptographic_signature" TEXT NOT NULL,
  "conditions_snapshot" JSONB NOT NULL,
  CONSTRAINT "composite_band_acknowledgments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "composite_band_acknowledgments_student_id_idx"
  ON "ttg"."composite_band_acknowledgments"("student_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'composite_band_acknowledgments'
      AND constraint_name = 'composite_band_acknowledgments_student_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."composite_band_acknowledgments"
      ADD CONSTRAINT "composite_band_acknowledgments_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "ttg"."StudentAthlete"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

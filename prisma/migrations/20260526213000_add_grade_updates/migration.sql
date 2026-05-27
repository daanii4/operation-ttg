CREATE TABLE IF NOT EXISTS "ttg"."grade_updates" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "course_record_id" TEXT NOT NULL,
  "observed_grade" TEXT NOT NULL,
  "observed_at" TIMESTAMP(3) NOT NULL,
  "data_source_class" TEXT NOT NULL,
  "advisor_id" TEXT NOT NULL,
  CONSTRAINT "grade_updates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "grade_updates_student_id_observed_at_idx"
  ON "ttg"."grade_updates"("student_id", "observed_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'grade_updates'
      AND constraint_name = 'grade_updates_student_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."grade_updates"
      ADD CONSTRAINT "grade_updates_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "ttg"."StudentAthlete"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'grade_updates'
      AND constraint_name = 'grade_updates_course_record_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."grade_updates"
      ADD CONSTRAINT "grade_updates_course_record_id_fkey"
      FOREIGN KEY ("course_record_id")
      REFERENCES "ttg"."CourseRecord"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

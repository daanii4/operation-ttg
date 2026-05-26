-- F1–F7: CourseRecord term metadata for eligibility calculations
ALTER TABLE "ttg"."CourseRecord" ADD COLUMN IF NOT EXISTS "termLength" TEXT NOT NULL DEFAULT 'semester';
ALTER TABLE "ttg"."CourseRecord" ADD COLUMN IF NOT EXISTS "academicYear" TEXT;

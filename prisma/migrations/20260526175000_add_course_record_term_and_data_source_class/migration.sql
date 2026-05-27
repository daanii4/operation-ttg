-- Manual transcript entry support (Class C + term metadata)
ALTER TABLE "ttg"."CourseRecord"
  ADD COLUMN IF NOT EXISTS "term" TEXT;

ALTER TABLE "ttg"."CourseRecord"
  ADD COLUMN IF NOT EXISTS "dataSourceClass" TEXT NOT NULL DEFAULT 'B';

-- Sprint 6 / Workstream C-1 — student-advisor assignments + advisor invites.

CREATE TABLE IF NOT EXISTS "ttg"."student_advisor_assignments" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "advisor_id" TEXT NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assigned_by" TEXT NOT NULL,
  CONSTRAINT "student_advisor_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_advisor_assignments_student_id_advisor_id_key"
  ON "ttg"."student_advisor_assignments" ("student_id", "advisor_id");

CREATE INDEX IF NOT EXISTS "student_advisor_assignments_advisor_id_idx"
  ON "ttg"."student_advisor_assignments" ("advisor_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'student_advisor_assignments'
      AND constraint_name = 'student_advisor_assignments_student_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."student_advisor_assignments"
      ADD CONSTRAINT "student_advisor_assignments_student_id_fkey"
      FOREIGN KEY ("student_id")
      REFERENCES "ttg"."StudentAthlete"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ttg'
      AND table_name = 'student_advisor_assignments'
      AND constraint_name = 'student_advisor_assignments_advisor_id_fkey'
  ) THEN
    ALTER TABLE "ttg"."student_advisor_assignments"
      ADD CONSTRAINT "student_advisor_assignments_advisor_id_fkey"
      FOREIGN KEY ("advisor_id")
      REFERENCES "ttg"."advisor_profiles"("advisor_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ttg"."advisor_invites" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "ttg"."AdvisorRole" NOT NULL DEFAULT 'advisor',
  "invited_by" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "accepted" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "advisor_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "advisor_invites_token_key"
  ON "ttg"."advisor_invites" ("token");

CREATE INDEX IF NOT EXISTS "advisor_invites_token_idx"
  ON "ttg"."advisor_invites" ("token");

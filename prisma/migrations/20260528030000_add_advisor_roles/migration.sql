-- Sprint 6 / Workstream C-1 — multi-advisor team roles.
--
-- Adds the AdvisorRole enum and the advisor_profiles table that the
-- permission system reads. Profiles are keyed by Supabase user UUID
-- (`advisor_id`) since that's the production session identity. The legacy
-- `User.role` column stays untouched; teamRole on advisor_profiles overlays
-- it for the multi-advisor permission system.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdvisorRole') THEN
    CREATE TYPE "ttg"."AdvisorRole" AS ENUM ('owner', 'advisor', 'viewer');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ttg"."advisor_profiles" (
  "id" TEXT NOT NULL,
  "advisor_id" TEXT NOT NULL,
  "team_role" "ttg"."AdvisorRole" NOT NULL DEFAULT 'advisor',
  "display_name" TEXT,
  "email" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "advisor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "advisor_profiles_advisor_id_key"
  ON "ttg"."advisor_profiles" ("advisor_id");

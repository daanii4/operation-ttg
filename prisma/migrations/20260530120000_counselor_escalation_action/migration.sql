-- Build 05: documented counselor response on safety escalation acknowledgment
CREATE TYPE "ttg"."CounselorEscalationAction" AS ENUM (
  'REFERRED_CLINICIAN',
  'PARENT_CONTACT',
  'CRISIS_PROTOCOL',
  'DOCUMENTED_ONLY',
  'OTHER'
);

ALTER TABLE "ttg"."composite_band_acknowledgments"
  ADD COLUMN "counselor_action" "ttg"."CounselorEscalationAction",
  ADD COLUMN "counselor_notes" TEXT;

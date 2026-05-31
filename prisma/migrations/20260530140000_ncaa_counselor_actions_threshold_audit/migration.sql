-- Build 06: NCAA counselor actions + threshold change audit log

CREATE TYPE "ttg"."CounselorEscalationAction_new" AS ENUM (
  'ADVISOR_CONTACT_MADE',
  'PARENT_GUARDIAN_NOTIFIED',
  'DISTRICT_REFERRAL',
  'PATHWAY_PIVOT_INITIATED',
  'WATCHLIST_ONLY'
);

ALTER TABLE "ttg"."composite_band_acknowledgments"
  ALTER COLUMN "counselor_action" DROP DEFAULT;

ALTER TABLE "ttg"."composite_band_acknowledgments"
  ALTER COLUMN "counselor_action" TYPE "ttg"."CounselorEscalationAction_new"
  USING (
    CASE "counselor_action"::text
      WHEN 'REFERRED_CLINICIAN' THEN 'DISTRICT_REFERRAL'::"ttg"."CounselorEscalationAction_new"
      WHEN 'PARENT_CONTACT' THEN 'PARENT_GUARDIAN_NOTIFIED'::"ttg"."CounselorEscalationAction_new"
      WHEN 'CRISIS_PROTOCOL' THEN 'DISTRICT_REFERRAL'::"ttg"."CounselorEscalationAction_new"
      WHEN 'DOCUMENTED_ONLY' THEN 'WATCHLIST_ONLY'::"ttg"."CounselorEscalationAction_new"
      WHEN 'OTHER' THEN 'WATCHLIST_ONLY'::"ttg"."CounselorEscalationAction_new"
      ELSE NULL
    END
  );

DROP TYPE IF EXISTS "ttg"."CounselorEscalationAction";
ALTER TYPE "ttg"."CounselorEscalationAction_new" RENAME TO "CounselorEscalationAction";

CREATE TABLE "ttg"."threshold_audit_logs" (
  "id" TEXT NOT NULL,
  "threshold_key" TEXT NOT NULL,
  "previous_value" DOUBLE PRECISION NOT NULL,
  "new_value" DOUBLE PRECISION NOT NULL,
  "changed_by" TEXT NOT NULL,
  "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,
  CONSTRAINT "threshold_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "threshold_audit_logs_threshold_key_idx" ON "ttg"."threshold_audit_logs"("threshold_key");
CREATE INDEX "threshold_audit_logs_changed_at_idx" ON "ttg"."threshold_audit_logs"("changed_at");

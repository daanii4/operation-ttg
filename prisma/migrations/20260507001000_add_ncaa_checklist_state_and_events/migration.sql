-- CreateEnum
CREATE TYPE "ttg"."NcaaChecklistItemKey" AS ENUM (
  'account_created',
  'ncaa_id_obtained',
  'official_transcript_sent',
  'amateurism_questionnaire_completed',
  'fee_waiver_applied_if_applicable'
);

-- CreateTable
CREATE TABLE "ttg"."NcaEligibilityChecklistState" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "accountCreated" BOOLEAN NOT NULL DEFAULT false,
  "ncaaIdObtained" BOOLEAN NOT NULL DEFAULT false,
  "officialTranscriptSent" BOOLEAN NOT NULL DEFAULT false,
  "amateurismQuestionnaireComplete" BOOLEAN NOT NULL DEFAULT false,
  "feeWaiverAppliedIfApplicable" BOOLEAN NOT NULL DEFAULT false,
  "updatedByActorId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NcaEligibilityChecklistState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ttg"."NcaEligibilityChecklistEvent" (
  "id" TEXT NOT NULL,
  "stateId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "itemKey" "ttg"."NcaaChecklistItemKey" NOT NULL,
  "checked" BOOLEAN NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT,
  "sourceContext" TEXT,
  "previousHash" TEXT,
  "eventHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NcaEligibilityChecklistEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NcaEligibilityChecklistState_studentId_key"
ON "ttg"."NcaEligibilityChecklistState"("studentId");

-- CreateIndex
CREATE INDEX "NcaEligibilityChecklistState_studentId_idx"
ON "ttg"."NcaEligibilityChecklistState"("studentId");

-- CreateIndex
CREATE INDEX "NcaEligibilityChecklistEvent_studentId_createdAt_idx"
ON "ttg"."NcaEligibilityChecklistEvent"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "NcaEligibilityChecklistEvent_stateId_createdAt_idx"
ON "ttg"."NcaEligibilityChecklistEvent"("stateId", "createdAt");

-- AddForeignKey
ALTER TABLE "ttg"."NcaEligibilityChecklistEvent"
ADD CONSTRAINT "NcaEligibilityChecklistEvent_stateId_fkey"
FOREIGN KEY ("stateId")
REFERENCES "ttg"."NcaEligibilityChecklistState"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

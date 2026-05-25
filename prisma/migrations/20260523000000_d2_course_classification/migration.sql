-- D2: District + CourseClassification; SchoolCalendar → HighSchool (calendar-preserving)

CREATE TABLE "ttg"."District" (
    "id" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'CA',
    "ucDistrictId" TEXT,
    "lastVerifiedDate" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ttg"."SchoolCalendar" RENAME TO "HighSchool";

-- Drop StudentAthlete FK before the unique index it depends on
ALTER TABLE "ttg"."StudentAthlete" DROP CONSTRAINT IF EXISTS "StudentAthlete_highSchoolId_fkey";
DROP INDEX IF EXISTS "ttg"."SchoolCalendar_highSchoolId_key";

ALTER TABLE "ttg"."HighSchool" RENAME COLUMN "highSchoolName" TO "schoolName";

ALTER TABLE "ttg"."HighSchool" ADD COLUMN "districtId" TEXT;
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "ceebCode" TEXT;
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "ucInstitutionId" TEXT;
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "schoolCleared" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "state" TEXT NOT NULL DEFAULT 'CA';
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "city" TEXT;
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "summerTermEnd" TIMESTAMP(3);
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "creditRecoveryDeadlines" JSONB;
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "summerRegistrationClose" TIMESTAMP(3);
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "markingPeriodCloses" JSONB;
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "lastCalendarVerified" TIMESTAMP(3);
ALTER TABLE "ttg"."HighSchool" ADD COLUMN "courseNameAliases" JSONB;

UPDATE "ttg"."HighSchool"
SET "ceebCode" = 'LEGACY_' || "highSchoolId"
WHERE "ceebCode" IS NULL;

ALTER TABLE "ttg"."HighSchool" ALTER COLUMN "ceebCode" SET NOT NULL;

ALTER TABLE "ttg"."HighSchool" ALTER COLUMN "seniorFallTermStart" DROP NOT NULL;

ALTER TABLE "ttg"."SchoolTerm" RENAME COLUMN "schoolCalendarId" TO "highSchoolId";

ALTER TABLE "ttg"."SchoolTerm" DROP CONSTRAINT IF EXISTS "SchoolTerm_schoolCalendarId_fkey";
ALTER TABLE "ttg"."SchoolTerm" ADD CONSTRAINT "SchoolTerm_highSchoolId_fkey"
    FOREIGN KEY ("highSchoolId") REFERENCES "ttg"."HighSchool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "ttg"."StudentAthlete" sa
SET "highSchoolId" = hs."id"
FROM "ttg"."HighSchool" hs
WHERE sa."highSchoolId" = hs."highSchoolId";

ALTER TABLE "ttg"."StudentAthlete" ADD CONSTRAINT "StudentAthlete_highSchoolId_fkey"
    FOREIGN KEY ("highSchoolId") REFERENCES "ttg"."HighSchool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ttg"."HighSchool" DROP COLUMN "highSchoolId";

CREATE UNIQUE INDEX "HighSchool_ceebCode_key" ON "ttg"."HighSchool"("ceebCode");

CREATE TABLE "ttg"."CourseClassification" (
    "id" TEXT NOT NULL,
    "highSchoolId" TEXT NOT NULL,
    "ceebCode" TEXT NOT NULL,
    "ucInstitutionId" TEXT,
    "courseNameNormalized" TEXT NOT NULL,
    "courseNameDisplay" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "ncaaD1Category" TEXT,
    "ncaaD2Category" TEXT,
    "ncaaApproved" BOOLEAN NOT NULL DEFAULT false,
    "ncaaApprovedHonors" BOOLEAN NOT NULL DEFAULT false,
    "countsGeometryForNcaa" BOOLEAN NOT NULL DEFAULT false,
    "agCategory" TEXT,
    "agApproved" BOOLEAN NOT NULL DEFAULT false,
    "ucApprovedHonors" BOOLEAN NOT NULL DEFAULT false,
    "countsLabForAg" BOOLEAN NOT NULL DEFAULT false,
    "countsGeometryForAg" BOOLEAN NOT NULL DEFAULT false,
    "agLanguageCode" TEXT,
    "preNinthGradeEligible" BOOLEAN NOT NULL DEFAULT false,
    "dataSourceClass" TEXT NOT NULL DEFAULT 'B',
    "lastVerifiedDate" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "ingestionMethod" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseClassification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseClassification_highSchoolId_courseNameNormalized_academicYear_key"
    ON "ttg"."CourseClassification"("highSchoolId", "courseNameNormalized", "academicYear");

CREATE INDEX "CourseClassification_highSchoolId_ncaaD1Category_idx"
    ON "ttg"."CourseClassification"("highSchoolId", "ncaaD1Category");

CREATE INDEX "CourseClassification_highSchoolId_agCategory_idx"
    ON "ttg"."CourseClassification"("highSchoolId", "agCategory");

CREATE INDEX "CourseClassification_highSchoolId_lastVerifiedDate_idx"
    ON "ttg"."CourseClassification"("highSchoolId", "lastVerifiedDate");

ALTER TABLE "ttg"."CourseClassification" ADD CONSTRAINT "CourseClassification_highSchoolId_fkey"
    FOREIGN KEY ("highSchoolId") REFERENCES "ttg"."HighSchool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ttg"."District" ("id", "districtName", "state", "createdAt")
VALUES ('district_legacy_migration', 'Legacy (pre-D2 migration)', 'CA', CURRENT_TIMESTAMP);

UPDATE "ttg"."HighSchool"
SET "districtId" = 'district_legacy_migration'
WHERE "districtId" IS NULL;

ALTER TABLE "ttg"."HighSchool" ALTER COLUMN "districtId" SET NOT NULL;

ALTER TABLE "ttg"."HighSchool" ADD CONSTRAINT "HighSchool_districtId_fkey"
    FOREIGN KEY ("districtId") REFERENCES "ttg"."District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

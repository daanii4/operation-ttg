-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ttg";

-- CreateEnum
CREATE TYPE "ttg"."TargetDivision" AS ENUM ('DI', 'DII', 'DI_or_DII_undecided', 'DIII', 'NAIA', 'Unknown');

-- CreateEnum
CREATE TYPE "ttg"."RiskBand" AS ENUM ('GREEN', 'YELLOW', 'RED', 'LOCKED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ttg"."EvidenceTier" AS ENUM ('Deterministic', 'Provisional', 'Strong', 'Moderate', 'Weak', 'Insufficient', 'Not_Applicable');

-- CreateEnum
CREATE TYPE "ttg"."UserRole" AS ENUM ('ADVISOR', 'ADMIN');

-- CreateTable
CREATE TABLE "ttg"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ttg"."UserRole" NOT NULL DEFAULT 'ADVISOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ttg"."SchoolCalendar" (
    "id" TEXT NOT NULL,
    "highSchoolId" TEXT NOT NULL,
    "highSchoolName" TEXT NOT NULL,
    "seniorFallTermStart" TIMESTAMP(3) NOT NULL,
    "maxCoresPerTerm" INTEGER NOT NULL DEFAULT 4,
    "maxEmsPerTerm" INTEGER NOT NULL DEFAULT 2,
    "calendarSourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ttg"."SchoolTerm" (
    "id" TEXT NOT NULL,
    "schoolCalendarId" TEXT NOT NULL,
    "termName" TEXT NOT NULL,
    "termType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ttg"."StudentAthlete" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "targetDivision" "ttg"."TargetDivision" NOT NULL,
    "enrollmentDateGrade9" TIMESTAMP(3) NOT NULL,
    "highSchoolId" TEXT NOT NULL,
    "highSchoolName" TEXT NOT NULL,
    "advisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAthlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ttg"."CourseRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "gradeLetterNormalized" TEXT NOT NULL,
    "termEndDate" TIMESTAMP(3) NOT NULL,
    "ncaaD1Category" TEXT,
    "ncaaApproved" BOOLEAN NOT NULL DEFAULT false,
    "agCategory" TEXT,
    "classificationUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ttg"."F5Result" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "applicable" BOOLEAN NOT NULL,
    "notApplicableReason" TEXT,
    "lockInDate" TIMESTAMP(3),
    "lockInDateBasis" TEXT,
    "provisionalFlag" BOOLEAN NOT NULL DEFAULT false,
    "daysToLock" INTEGER,
    "pastLock" BOOLEAN NOT NULL DEFAULT false,
    "completedTotal" INTEGER NOT NULL DEFAULT 0,
    "completedEngMathSci" INTEGER NOT NULL DEFAULT 0,
    "missingTotal" INTEGER NOT NULL DEFAULT 0,
    "missingEngMathSci" INTEGER NOT NULL DEFAULT 0,
    "riskBand" "ttg"."RiskBand" NOT NULL,
    "evidenceTier" "ttg"."EvidenceTier" NOT NULL,
    "agFailureDualFlags" JSONB NOT NULL DEFAULT '[]',
    "unclassifiedCourseIds" JSONB NOT NULL DEFAULT '[]',
    "recommendedCoursesNextTerm" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "F5Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "ttg"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolCalendar_highSchoolId_key" ON "ttg"."SchoolCalendar"("highSchoolId");

-- CreateIndex
CREATE INDEX "StudentAthlete_advisorId_idx" ON "ttg"."StudentAthlete"("advisorId");

-- CreateIndex
CREATE INDEX "StudentAthlete_highSchoolId_idx" ON "ttg"."StudentAthlete"("highSchoolId");

-- CreateIndex
CREATE INDEX "CourseRecord_studentId_idx" ON "ttg"."CourseRecord"("studentId");

-- CreateIndex
CREATE INDEX "F5Result_studentId_idx" ON "ttg"."F5Result"("studentId");

-- CreateIndex
CREATE INDEX "F5Result_computedAt_idx" ON "ttg"."F5Result"("computedAt");

-- AddForeignKey
ALTER TABLE "ttg"."SchoolTerm" ADD CONSTRAINT "SchoolTerm_schoolCalendarId_fkey" FOREIGN KEY ("schoolCalendarId") REFERENCES "ttg"."SchoolCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ttg"."StudentAthlete" ADD CONSTRAINT "StudentAthlete_highSchoolId_fkey" FOREIGN KEY ("highSchoolId") REFERENCES "ttg"."SchoolCalendar"("highSchoolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ttg"."StudentAthlete" ADD CONSTRAINT "StudentAthlete_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "ttg"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ttg"."CourseRecord" ADD CONSTRAINT "CourseRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ttg"."StudentAthlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ttg"."F5Result" ADD CONSTRAINT "F5Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ttg"."StudentAthlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

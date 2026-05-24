import type { Prisma } from "@prisma/client";
import { normalizeCourseName } from "@/lib/utils/course-normalize";
import type { ParsedAgCourse, ParsedNcaaCourse } from "@/lib/ingestion/parse-course-table";
import { buildNcaaPortalUrl, buildUcAgListUrl } from "@/lib/ingestion/portal-urls";

export interface ImportContext {
  highSchoolId: string;
  ceebCode: string;
  ucInstitutionId: string | null;
  academicYear: string;
  verifiedBy: string;
  source: "ncaa" | "ucag";
}

export async function upsertNcaaRows(
  tx: Prisma.TransactionClient,
  ctx: ImportContext,
  rows: ParsedNcaaCourse[]
): Promise<{ imported: number; updated: number }> {
  let imported = 0;
  let updated = 0;
  const sourceUrl = buildNcaaPortalUrl(ctx.ceebCode);
  const now = new Date();

  for (const row of rows) {
    const courseNameNormalized = normalizeCourseName(row.courseNameDisplay);
    const existing = await tx.courseClassification.findUnique({
      where: {
        highSchoolId_courseNameNormalized_academicYear: {
          highSchoolId: ctx.highSchoolId,
          courseNameNormalized,
          academicYear: ctx.academicYear,
        },
      },
    });

    const data = {
      courseNameDisplay: row.courseNameDisplay,
      ncaaD1Category: row.ncaaD1Category,
      ncaaD2Category: row.ncaaD1Category,
      ncaaApproved: row.approved,
      ncaaApprovedHonors: row.ncaaApprovedHonors,
      lastVerifiedDate: now,
      sourceUrl,
      ingestionMethod: "paste_parse",
      dataSourceClass: "B",
      verifiedBy: ctx.verifiedBy,
      ceebCode: ctx.ceebCode,
      ucInstitutionId: ctx.ucInstitutionId,
    };

    if (existing) {
      await tx.courseClassification.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await tx.courseClassification.create({
        data: {
          highSchoolId: ctx.highSchoolId,
          courseNameNormalized,
          academicYear: ctx.academicYear,
          ...data,
        },
      });
      imported++;
    }
  }

  return { imported, updated };
}

export async function upsertAgRows(
  tx: Prisma.TransactionClient,
  ctx: ImportContext,
  rows: ParsedAgCourse[]
): Promise<{ imported: number; updated: number }> {
  let imported = 0;
  let updated = 0;
  const sourceUrl = buildUcAgListUrl(ctx.ucInstitutionId);
  const now = new Date();

  for (const row of rows) {
    if (row.status === "archived") continue;

    const courseNameNormalized = normalizeCourseName(row.courseNameDisplay);
    const existing = await tx.courseClassification.findUnique({
      where: {
        highSchoolId_courseNameNormalized_academicYear: {
          highSchoolId: ctx.highSchoolId,
          courseNameNormalized,
          academicYear: ctx.academicYear,
        },
      },
    });

    const agData = {
      courseNameDisplay: row.courseNameDisplay,
      agCategory: row.agCategory,
      agApproved: row.status === "active",
      ucApprovedHonors: row.ucApprovedHonors,
      countsLabForAg: row.agCategory === "d",
      lastVerifiedDate: now,
      sourceUrl,
      ingestionMethod: "paste_parse",
      dataSourceClass: "B",
      verifiedBy: ctx.verifiedBy,
      ceebCode: ctx.ceebCode,
      ucInstitutionId: ctx.ucInstitutionId,
    };

    if (existing) {
      await tx.courseClassification.update({
        where: { id: existing.id },
        data: agData,
      });
      updated++;
    } else {
      await tx.courseClassification.create({
        data: {
          highSchoolId: ctx.highSchoolId,
          courseNameNormalized,
          academicYear: ctx.academicYear,
          ...agData,
        },
      });
      imported++;
    }
  }

  return { imported, updated };
}

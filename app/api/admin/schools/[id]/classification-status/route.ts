import { NextResponse } from "next/server";
import { differenceInDays } from "date-fns";
import { prismaTtg } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import {
  handleAuthError,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/auth/api-errors";
import { buildNcaaPortalUrl, buildUcAgListUrl } from "@/lib/ingestion/portal-urls";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    try {
      await requireAdminSession();
    } catch {
      return unauthorizedResponse();
    }

    const school = await prismaTtg.highSchool.findUnique({
      where: { id: params.id },
    });
    if (!school) return notFoundResponse();

    const rows = await prismaTtg.courseClassification.findMany({
      where: { highSchoolId: params.id },
      select: {
        lastVerifiedDate: true,
        ncaaD1Category: true,
        agCategory: true,
        ingestionMethod: true,
      },
    });

    const lastVerified =
      rows.length > 0
        ? rows.reduce(
            (max, r) => (r.lastVerifiedDate > max ? r.lastVerifiedDate : max),
            rows[0].lastVerifiedDate
          )
        : null;

    const daysStale = lastVerified
      ? differenceInDays(new Date(), lastVerified)
      : 9999;

    return NextResponse.json({
      highSchoolId: school.id,
      schoolName: school.schoolName,
      ceebCode: school.ceebCode,
      lastVerifiedDate: lastVerified?.toISOString() ?? null,
      daysStale,
      isStale: daysStale > 365,
      totalClassifications: rows.length,
      ncaaClassified: rows.filter((r) => r.ncaaD1Category != null).length,
      agClassified: rows.filter((r) => r.agCategory != null).length,
      unverifiedCount: rows.filter((r) => r.ingestionMethod === "manual_seed").length,
      ncaaPortalUrl: buildNcaaPortalUrl(school.ceebCode),
      ucAgListUrl: buildUcAgListUrl(school.ucInstitutionId),
    });
  } catch (err) {
    return handleAuthError(err);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaTtg } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import {
  badRequestResponse,
  handleAuthError,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/auth/api-errors";
import {
  parseAgCourseTable,
  parseNcaaCourseTable,
} from "@/lib/ingestion/parse-course-table";
import {
  upsertAgRows,
  upsertNcaaRows,
} from "@/lib/ingestion/import-classifications";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  source: z.enum(["ncaa", "ucag"]),
  academicYear: z.string().min(1),
  pastedText: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    let session;
    try {
      session = await requireAdminSession();
    } catch {
      return unauthorizedResponse();
    }

    const school = await prismaTtg.highSchool.findUnique({
      where: { id: params.id },
    });
    if (!school) return notFoundResponse();

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.message);
    }

    const { source, academicYear, pastedText } = parsed.data;
    const ctx = {
      highSchoolId: school.id,
      ceebCode: school.ceebCode,
      ucInstitutionId: school.ucInstitutionId,
      academicYear,
      verifiedBy: session.userId,
      source,
    };

    if (source === "ncaa") {
      const { courses, skipped } = parseNcaaCourseTable(pastedText);
      const counts = await prismaTtg.$transaction((tx) =>
        upsertNcaaRows(tx, ctx, courses)
      );
      return NextResponse.json({ ...counts, skipped });
    }

    const { courses, skipped } = parseAgCourseTable(pastedText);
    const counts = await prismaTtg.$transaction((tx) =>
      upsertAgRows(tx, ctx, courses)
    );
    return NextResponse.json({ ...counts, skipped });
  } catch (err) {
    return handleAuthError(err);
  }
}

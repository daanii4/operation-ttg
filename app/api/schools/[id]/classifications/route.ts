import { NextResponse } from "next/server";
import { prismaTtg } from "@/lib/prisma";
import { getTtgSession } from "@/lib/auth/session";
import { handleAuthError, notFoundResponse, unauthorizedResponse } from "@/lib/auth/api-errors";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getTtgSession();
    if (!session) return unauthorizedResponse();

    const school = await prismaTtg.highSchool.findUnique({
      where: { id: params.id },
    });
    if (!school) return notFoundResponse();

    const classifications = await prismaTtg.courseClassification.findMany({
      where: { highSchoolId: params.id },
      orderBy: [{ academicYear: "desc" }, { courseNameDisplay: "asc" }],
    });

    return NextResponse.json({ highSchoolId: params.id, classifications });
  } catch (err) {
    return handleAuthError(err);
  }
}

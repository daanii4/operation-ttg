import { NextResponse } from "next/server";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { buildStudentBriefing } from "@/lib/eligibility/build-student-briefing";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireTtgSession();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const result = await buildStudentBriefing(params.id);
    if (!result.found) return notFoundResponse();

    const { record } = result;
    return NextResponse.json({
      ...record.bundle,
      f8: record.f8,
      f9: record.f9,
      f10: record.f10,
      f11: record.f11,
      f12: record.f12,
      computedAt: record.computedAt,
      observations: record.observations,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Eligibility computation failed", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

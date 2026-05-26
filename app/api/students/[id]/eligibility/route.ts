import { NextResponse } from "next/server";
import { ALL_DEMO_STUDENTS } from "@/lib/seed/demo-data";
import {
  f5CoursesToClassified,
  f5StudentToStudentInput,
} from "@/lib/eligibility/demo-classified-courses";
import { computeEligibilityBundle } from "@/lib/eligibility/compute-eligibility";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";

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

  const demo = ALL_DEMO_STUDENTS.find((d) => d.student.id === params.id);
  if (!demo) return notFoundResponse();

  try {
    const student = f5StudentToStudentInput(demo.student);
    const courses = f5CoursesToClassified(demo.courses, `${demo.calendarYear}-26`);
    const bundle = computeEligibilityBundle(student, courses);
    return NextResponse.json(bundle);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Eligibility computation failed", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

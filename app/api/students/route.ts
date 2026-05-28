/**
 * POST /api/students — create a student-athlete (intake).
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import {
  createStudentAthlete,
  StudentIntakeValidationError,
} from "@/lib/students/create-student-athlete";
import { StudentIntakeSchema } from "@/lib/validators/student-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireTtgSession();
    const body = StudentIntakeSchema.parse(await req.json());
    const student = await createStudentAthlete(session, body);

    return NextResponse.json(
      {
        data: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          grade: student.grade,
          highSchoolId: student.highSchoolId,
          highSchoolName: student.highSchoolName,
          targetDivision: student.targetDivision,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          code: "VALIDATION_ERROR",
          detail: err.flatten(),
        },
        { status: 400 }
      );
    }
    if (err instanceof StudentIntakeValidationError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 }
      );
    }
    return handleApiError(err);
  }
}

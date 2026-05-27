import { NextResponse } from "next/server";
import { z } from "zod";
import { getTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";
import { calcGpaTrajectory } from "@/lib/calculations/f9";

const GradeUpdateSchema = z.object({
  course_record_id: z.string().uuid(),
  observed_grade: z.enum(["A", "B", "C", "D", "F", "IP"]),
  observed_at: z.string().datetime(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const parse = GradeUpdateSchema.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", detail: parse.error.flatten() },
      { status: 400 }
    );
  }

  const student = await prismaTtg.studentAthlete.findUnique({
    where: { id: params.id },
    select: { id: true, advisorId: true },
  });
  if (!student) {
    return NextResponse.json(
      { error: "Student not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (session.role === "ADVISOR" && student.advisorId && student.advisorId !== session.userId) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const course = await prismaTtg.courseRecord.findFirst({
    where: {
      id: parse.data.course_record_id,
      studentId: params.id,
    },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json(
      { error: "Course not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const newRow = await prismaTtg.gradeUpdate.create({
    data: {
      student_id: params.id,
      course_record_id: parse.data.course_record_id,
      observed_grade: parse.data.observed_grade,
      observed_at: new Date(parse.data.observed_at),
      data_source_class: "C",
      advisor_id: session.userId,
    },
    select: { id: true },
  });

  const updates = await prismaTtg.gradeUpdate.findMany({
    where: { student_id: params.id },
    orderBy: { observed_at: "asc" },
    select: {
      observed_grade: true,
      observed_at: true,
      data_source_class: true,
    },
  });

  calcGpaTrajectory(
    updates.map((row) => ({
      observed_grade: row.observed_grade,
      observed_at: row.observed_at,
      data_source_class: row.data_source_class as "A" | "B" | "C",
    }))
  );

  return NextResponse.json({ data: { gradeUpdateId: newRow.id } }, { status: 201 });
}

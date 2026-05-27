import { NextResponse } from "next/server";
import { z } from "zod";
import { getTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";

const EngagementSchema = z.object({
  engagement_type: z.enum([
    "practice_attendance",
    "academic_session",
    "advisor_contact",
    "team_activity",
    "self_report_motivation",
  ]),
  value: z.number().min(0).max(1),
  observed_at: z.string().datetime(),
  context: z.string().max(500).optional(),
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

  const parse = EngagementSchema.safeParse(await request.json());
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

  const newRow = await prismaTtg.engagementObservation.create({
    data: {
      student_id: params.id,
      observed_at: new Date(parse.data.observed_at),
      engagement_type: parse.data.engagement_type,
      value: parse.data.value,
      raw_value: String(parse.data.value),
      context: parse.data.context ?? null,
      data_source_class: "C",
      advisor_id: session.userId,
    },
    select: { id: true },
  });

  return NextResponse.json({ data: { observationId: newRow.id } }, { status: 201 });
}

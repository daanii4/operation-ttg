import { NextResponse } from "next/server";
import { z } from "zod";
import { getTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";

const AimsSchema = z.object({
  social_identity_score: z.number().min(0).max(70),
  exclusivity_score: z.number().min(0).max(70),
  negative_affectivity_score: z.number().min(0).max(70),
  aims_version: z.enum(["AIMS-2", "AIMS-3"]),
  administered_at: z.string().datetime(),
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

  const parse = AimsSchema.safeParse(await request.json());
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

  const newRow = await prismaTtg.aimsAssessment.create({
    data: {
      student_id: params.id,
      social_identity_score: parse.data.social_identity_score,
      exclusivity_score: parse.data.exclusivity_score,
      negative_affectivity_score: parse.data.negative_affectivity_score,
      aims_version: parse.data.aims_version,
      administered_at: new Date(parse.data.administered_at),
      data_source_class: "C",
    },
    select: { id: true },
  });

  return NextResponse.json({ data: { assessmentId: newRow.id } }, { status: 201 });
}

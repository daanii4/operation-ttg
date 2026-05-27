import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";
import { ALL_DEMO_STUDENTS } from "@/lib/seed/demo-data";

const AckSchema = z.object({
  band_transition: z.string().min(3).max(32),
  cryptographic_signature: z.string().min(64).max(64),
  acknowledged_at: z.string().datetime(),
  conditions_snapshot: z.record(z.string(), z.unknown()),
});

function computeSignature(input: {
  studentId: string;
  advisorId: string;
  bandTransition: string;
  acknowledgedAtIso: string;
}): string {
  return createHash("sha256")
    .update(
      `${input.studentId}${input.advisorId}${input.bandTransition}${input.acknowledgedAtIso}`,
      "utf8"
    )
    .digest("hex");
}

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

  const parse = AckSchema.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", detail: parse.error.flatten() },
      { status: 400 }
    );
  }

  const expectedSignature = computeSignature({
    studentId: params.id,
    advisorId: session.userId,
    bandTransition: parse.data.band_transition,
    acknowledgedAtIso: parse.data.acknowledged_at,
  });

  if (parse.data.cryptographic_signature !== expectedSignature) {
    return NextResponse.json(
      { error: "Invalid signature", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const student = await prismaTtg.studentAthlete.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!student) {
    const demo = ALL_DEMO_STUDENTS.find((row) => row.student.id === params.id);
    if (!demo) {
      return NextResponse.json(
        { error: "Student not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prismaTtg.studentAthlete.create({
      data: {
        id: demo.student.id,
        firstName: demo.student.id,
        lastName: "Demo",
        grade: demo.student.grade,
        targetDivision: demo.student.targetDivision as
          | "DI"
          | "DII"
          | "DI_or_DII_undecided"
          | "DIII"
          | "NAIA"
          | "Unknown",
        enrollmentDateGrade9: demo.student.enrollmentDateGrade9,
        highSchoolId: demo.student.highSchoolId,
        highSchoolName: demo.student.highSchoolName,
        advisorId: null,
      },
      select: { id: true },
    });
  }

  await prismaTtg.compositeBandAcknowledgment.create({
    data: {
      student_id: params.id,
      advisor_id: session.userId,
      band_transition: parse.data.band_transition,
      acknowledged_at: new Date(parse.data.acknowledged_at),
      cryptographic_signature: parse.data.cryptographic_signature,
      conditions_snapshot: parse.data.conditions_snapshot as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return NextResponse.json({ data: { acknowledged: true } });
}

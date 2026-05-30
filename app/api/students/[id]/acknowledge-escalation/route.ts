import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { CounselorEscalationAction, Prisma } from "@prisma/client";
import { z } from "zod";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getTtgSession } from "@/lib/auth/session";
import { canAcknowledgeEscalation } from "@/lib/briefings/escalation-access";
import { prismaTtg } from "@/lib/prisma";
import { ALL_DEMO_STUDENTS } from "@/lib/seed/demo-data";

const AckSchema = z.object({
  band_transition: z.string().min(3).max(64),
  cryptographic_signature: z.string().min(64).max(64),
  acknowledged_at: z.string().datetime(),
  conditions_snapshot: z.record(z.string(), z.unknown()),
  counselor_action: z.nativeEnum(CounselorEscalationAction),
  counselor_notes: z.string().min(8).max(2000),
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

  let student = await prismaTtg.studentAthlete.findUnique({
    where: { id: params.id },
    select: { id: true, advisorId: true },
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
      select: { id: true, advisorId: true },
    });
    student = { id: params.id, advisorId: null };
  }

  const profile = await ensureAdvisorProfile(session);
  if (
    !canAcknowledgeEscalation({
      sessionUserId: session.userId,
      teamRole: profile.teamRole,
      assignedAdvisorId: student.advisorId,
    })
  ) {
    return NextResponse.json(
      { error: "Assigned advisor must acknowledge this escalation", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  await prismaTtg.compositeBandAcknowledgment.create({
    data: {
      student_id: params.id,
      advisor_id: session.userId,
      band_transition: parse.data.band_transition,
      acknowledged_at: new Date(parse.data.acknowledged_at),
      cryptographic_signature: parse.data.cryptographic_signature,
      conditions_snapshot: parse.data.conditions_snapshot as unknown as Prisma.InputJsonValue,
      counselor_action: parse.data.counselor_action,
      counselor_notes: parse.data.counselor_notes.trim(),
    },
    select: { id: true },
  });

  return NextResponse.json({ data: { acknowledged: true } });
}

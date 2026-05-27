import { NextResponse } from "next/server";
import { z } from "zod";
import { getTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";
import { recalculateF5 } from "@/lib/f5/recalculate-f5";

const TranscriptEntrySchema = z.object({
  courseName: z.string().trim().min(2).max(200),
  gradeLetter: z.enum(["A", "B", "C", "D", "F", "IP"]),
  term: z.enum(["fall", "spring", "summer"]),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format must be YYYY-YY (e.g. 2024-25)"),
  termLength: z.enum(["semester", "quarter", "trimester", "year"]),
});

function buildTermEndDate(term: "fall" | "spring" | "summer", academicYear: string): Date {
  const [startYearRaw, endYearSuffixRaw] = academicYear.split("-");
  const startYear = Number(startYearRaw);
  const endYearSuffix = Number(endYearSuffixRaw);
  const centuryBase = Math.floor(startYear / 100) * 100;
  const endYear = centuryBase + endYearSuffix;

  if (term === "fall") {
    return new Date(`${startYear}-12-15T00:00:00.000Z`);
  }
  if (term === "spring") {
    return new Date(`${endYear}-05-31T00:00:00.000Z`);
  }
  return new Date(`${endYear}-08-01T00:00:00.000Z`);
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

  const parse = TranscriptEntrySchema.safeParse(await request.json());
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

  const { courseName, gradeLetter, term, academicYear, termLength } = parse.data;
  const termEndDate = buildTermEndDate(term, academicYear);

  const newRecord = await prismaTtg.courseRecord.create({
    data: {
      studentId: params.id,
      courseName,
      gradeLetterNormalized: gradeLetter,
      term,
      termLength,
      academicYear,
      termEndDate,
      dataSourceClass: "C",
    },
    select: { id: true },
  });

  await recalculateF5(params.id);

  return NextResponse.json(
    { data: { courseRecordId: newRecord.id } },
    { status: 201 }
  );
}

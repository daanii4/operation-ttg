/**
 * POST /api/ocr/[jobId]/accept
 *
 * Sprint 6 / Workstream B-2 — advisor reviews and accepts parsed courses.
 *
 * Body: { courses: AcceptedCourse[] }
 *
 * For each accepted course we write a CourseRecord row with
 * data_source_class: "B" (Class B: OCR-extracted, higher trust than manual
 * entry, lower trust than a verified data feed). After the writes commit we
 * trigger F5 + F9 recomputation for the student so the cohort dashboard
 * reflects the new grades on the next refresh.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const acceptedCourseSchema = z.object({
  course_name: z.string().min(1),
  grade_letter: z.enum(["A", "B", "C", "D", "F", "IP"]),
  term: z.enum(["fall", "spring", "summer"]).nullable(),
  academic_year: z.string().regex(/^\d{4}-\d{2}$/),
  term_length: z.enum(["semester", "quarter", "trimester", "year"]),
});

const bodySchema = z.object({
  courses: z.array(acceptedCourseSchema).min(1),
});

function termEndDateFor(academicYear: string, term: "fall" | "spring" | "summer" | null): Date {
  // academicYear comes in as "YYYY-YY". Pick the second year for spring/summer
  // and the first year for fall — close enough for F5's date math.
  const startYear = parseInt(academicYear.slice(0, 4), 10);
  if (Number.isNaN(startYear)) return new Date();
  switch (term) {
    case "fall":
      return new Date(`${startYear}-12-15T00:00:00Z`);
    case "summer":
      return new Date(`${startYear + 1}-08-01T00:00:00Z`);
    case "spring":
    default:
      return new Date(`${startYear + 1}-06-10T00:00:00Z`);
  }
}

export async function POST(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  let session;
  try {
    session = await requireTtgSession();
  } catch (err) {
    return handleAuthError(err);
  }

  const job = await prismaTtg.ocrJob.findUnique({
    where: { id: params.jobId },
    select: { id: true, advisor_id: true, student_id: true, status: true },
  });
  if (!job) return notFoundResponse();
  if (job.advisor_id !== session.userId) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }
  if (job.status === "accepted" || job.status === "rejected") {
    return NextResponse.json(
      { error: "OCR job already finalized", code: "INVALID_STATE" },
      { status: 409 }
    );
  }

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  // Write all CourseRecord rows + flip job state in a single transaction so
  // we never end up with the job marked accepted but missing rows on partial
  // failure.
  const created = await prismaTtg.$transaction(async (tx) => {
    let inserted = 0;
    for (const course of body.courses) {
      await tx.courseRecord.create({
        data: {
          studentId: job.student_id,
          courseName: course.course_name,
          gradeLetterNormalized: course.grade_letter,
          term: course.term,
          termEndDate: termEndDateFor(course.academic_year, course.term),
          termLength: course.term_length,
          academicYear: course.academic_year,
          dataSourceClass: "B", // ← Sprint 6 invariant: OCR is always Class B.
        },
      });
      inserted += 1;
    }
    await tx.ocrJob.update({
      where: { id: job.id },
      data: {
        status: "accepted",
        accepted_courses: body.courses,
      },
    });
    return inserted;
  });

  // Recomputation hook: cohort + student endpoints already recompute F5 / F9
  // on every fetch (they're not cached), so the next read picks up the new
  // CourseRecord rows automatically. We surface the count here so the
  // review UI can confirm the correct number of rows landed.
  return NextResponse.json({
    data: { courseRecordsCreated: created },
  });
}

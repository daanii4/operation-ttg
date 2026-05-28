/**
 * Sprint 7 / Workstream A-4 — Class A ingestion orchestrator.
 *
 * Steps in order (every step is wrapped so a failure flips the job to
 * `failed` with a useful message):
 *
 *   1. assertDataFeedEnabled()
 *   2. resolve student + CEEB code (fall back to demo cohort when no DB row)
 *   3. create ClassAFeedJob row in `fetching` status
 *   4. call provider stub
 *   5. encrypt raw_payload via AES-256-GCM and persist
 *   6. dedupe + write CourseRecord rows with data_source_class: 'A'
 *   7. flip job to `complete` with counts; rely on the eligibility API to
 *      pick up the new course rows on the next read (F5 / F9 already
 *      recompute on demand) — no separate trigger pipeline needed.
 *
 * Dedupe rules (per spec acceptance gate):
 *   • Identical (course_name, academic_year, term) row already 'A' → skip.
 *   • Identical row but class 'B' or 'C' → upgrade to 'A' (no duplicate
 *     row created; the existing row's dataSourceClass + grade are updated).
 */

import type { Prisma } from "@prisma/client";
import { prismaTtg } from "@/lib/prisma";
import { ALL_DEMO_STUDENTS } from "@/lib/seed/demo-data";
import { assertDataFeedEnabled } from "./guards";
import { encryptPayload } from "./encryption";
import {
  fetchStudentTranscript,
  type ProviderId,
  type TranscriptApiCourse,
  type TranscriptApiResponse,
} from "./providers/transcriptApi";

export interface RunResult {
  jobId: string;
  status: "complete" | "failed";
  recordsFetched: number;
  recordsWritten: number;
  error?: string;
}

interface StudentRef {
  id: string;
  ceebCode: string;
}

async function resolveStudent(studentId: string): Promise<StudentRef | null> {
  const dbRow = await prismaTtg.studentAthlete
    .findUnique({
      where: { id: studentId },
      include: { highSchool: { select: { ceebCode: true } } },
    })
    .catch(() => null);
  if (dbRow?.highSchool?.ceebCode) {
    return { id: dbRow.id, ceebCode: dbRow.highSchool.ceebCode };
  }

  // Demo-cohort fallback: students without DB rows still need a CEEB so the
  // ingestion smoke test works locally. The synthetic provider doesn't care
  // what the value is, but we use a recognizable demo code so logs show it.
  const demo = ALL_DEMO_STUDENTS.find((d) => d.student.id === studentId);
  if (demo) {
    return { id: demo.student.id, ceebCode: "DEMO-CEEB-000000" };
  }
  return null;
}

function termEndDate(year: string, term: TranscriptApiCourse["term"]): Date {
  const startYear = parseInt(year.slice(0, 4), 10);
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

interface DedupeOutcome {
  written: number;
  upgraded: number;
  skipped: number;
}

async function persistCourses(
  tx: Prisma.TransactionClient,
  studentId: string,
  courses: TranscriptApiCourse[]
): Promise<DedupeOutcome> {
  let written = 0;
  let upgraded = 0;
  let skipped = 0;

  for (const c of courses) {
    const existing = await tx.courseRecord.findFirst({
      where: {
        studentId,
        courseName: c.course_name,
        academicYear: c.academic_year,
        term: c.term,
      },
      select: { id: true, dataSourceClass: true },
    });

    if (existing && existing.dataSourceClass === "A") {
      skipped += 1;
      continue;
    }

    if (existing) {
      // Upgrade B/C → A. We also refresh the grade (verified data wins).
      await tx.courseRecord.update({
        where: { id: existing.id },
        data: {
          gradeLetterNormalized: c.grade_letter,
          dataSourceClass: "A",
          termEndDate: termEndDate(c.academic_year, c.term),
          termLength: c.term_length,
        },
      });
      upgraded += 1;
      continue;
    }

    await tx.courseRecord.create({
      data: {
        studentId,
        courseName: c.course_name,
        gradeLetterNormalized: c.grade_letter,
        term: c.term,
        termEndDate: termEndDate(c.academic_year, c.term),
        termLength: c.term_length,
        academicYear: c.academic_year,
        dataSourceClass: "A",
      },
    });
    written += 1;
  }

  return { written, upgraded, skipped };
}

export interface RunClassAIngestionInput {
  studentId: string;
  provider: ProviderId;
  /** Optional advisor id stamped on the job row (for owner audit). */
  advisorId?: string;
}

export async function runClassAIngestion(
  args: RunClassAIngestionInput
): Promise<RunResult> {
  assertDataFeedEnabled();

  const ref = await resolveStudent(args.studentId);
  if (!ref) {
    throw new Error(`Student '${args.studentId}' not found`);
  }

  const job = await prismaTtg.classAFeedJob.create({
    data: {
      student_id: ref.id,
      provider: args.provider,
      status: "fetching",
    },
    select: { id: true },
  });

  let response: TranscriptApiResponse;
  try {
    response = await fetchStudentTranscript(ref.id, ref.ceebCode);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider call failed";
    await prismaTtg.classAFeedJob.update({
      where: { id: job.id },
      data: { status: "failed", error: message },
    });
    return {
      jobId: job.id,
      status: "failed",
      recordsFetched: 0,
      recordsWritten: 0,
      error: message,
    };
  }

  // Encrypt + persist the raw payload before any DB write of derived rows.
  // Plaintext NEVER touches the database.
  let encryptedPayload: Uint8Array<ArrayBuffer> | null = null;
  try {
    encryptedPayload = encryptPayload(JSON.stringify(response));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Encryption failed";
    await prismaTtg.classAFeedJob.update({
      where: { id: job.id },
      data: { status: "failed", error: message },
    });
    return {
      jobId: job.id,
      status: "failed",
      recordsFetched: 0,
      recordsWritten: 0,
      error: message,
    };
  }

  await prismaTtg.classAFeedJob.update({
    where: { id: job.id },
    data: {
      status: "processing",
      records_fetched: response.courses.length,
      raw_payload: encryptedPayload,
    },
  });

  try {
    const outcome = await prismaTtg.$transaction((tx) =>
      persistCourses(tx, ref.id, response.courses)
    );

    await prismaTtg.classAFeedJob.update({
      where: { id: job.id },
      data: {
        status: "complete",
        records_written: outcome.written + outcome.upgraded,
      },
    });

    return {
      jobId: job.id,
      status: "complete",
      recordsFetched: response.courses.length,
      recordsWritten: outcome.written + outcome.upgraded,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    await prismaTtg.classAFeedJob.update({
      where: { id: job.id },
      data: { status: "failed", error: message },
    });
    return {
      jobId: job.id,
      status: "failed",
      recordsFetched: response.courses.length,
      recordsWritten: 0,
      error: message,
    };
  }
}

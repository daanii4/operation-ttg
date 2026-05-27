/**
 * Sprint 5 — PDF job orchestration.
 *
 * Why a service module? Both `POST /api/pdf/student` and `POST /api/pdf/cohort`
 * follow the same five steps:
 *   1. create a `pdf_export_jobs` row in `pending`,
 *   2. flip to `generating`,
 *   3. render the PDF with `@react-pdf/renderer`,
 *   4. persist the buffer with status `ready`,
 *   5. on failure, write `failed` plus the error message.
 *
 * Centralizing the lifecycle here keeps the route handlers thin and means a
 * future Sprint 6 worker (e.g. waitUntil-driven) can call the same function
 * without re-deriving the state transitions.
 */

import { prismaTtg } from "@/lib/prisma";
import {
  generateCohortSummaryPdf,
  generateStudentBriefingPdf,
} from "@/lib/pdf/generate";

export type JobType = "student_briefing" | "cohort_summary";
export type JobStatus = "pending" | "generating" | "ready" | "failed";

export interface CreateJobArgs {
  advisorId: string;
  jobType: JobType;
  studentId?: string;
}

export async function createPdfJob(args: CreateJobArgs): Promise<{ id: string }> {
  const row = await prismaTtg.pdfExportJob.create({
    data: {
      advisor_id: args.advisorId,
      job_type: args.jobType,
      status: "pending",
      student_id: args.studentId ?? null,
    },
    select: { id: true },
  });
  return row;
}

/**
 * Prisma's Bytes column expects `Uint8Array<ArrayBuffer>` on update inputs.
 * `Buffer` satisfies the runtime contract (Buffer extends Uint8Array), but
 * recent @types/node makes `ArrayBufferLike` vs `ArrayBuffer` incompatible
 * at the type level. Reconstruct a plain Uint8Array view over the same
 * memory so the type-checker is happy and we don't copy bytes.
 */
function bufferToBytes(
  input: Buffer | null | undefined
): Uint8Array<ArrayBuffer> | null | undefined {
  if (input == null) return input;
  // Copy into a freshly-allocated ArrayBuffer so the resulting view is typed
  // as `Uint8Array<ArrayBuffer>` (rather than `ArrayBufferLike`), which is
  // what Prisma's generated update input requires.
  const ab = new ArrayBuffer(input.byteLength);
  const out = new Uint8Array(ab);
  out.set(input);
  return out;
}

export async function markJobStatus(
  jobId: string,
  status: JobStatus,
  patch?: { error?: string | null; pdfBuffer?: Buffer | null }
) {
  await prismaTtg.pdfExportJob.update({
    where: { id: jobId },
    data: {
      status,
      ...(patch?.error !== undefined ? { error: patch.error } : {}),
      ...(patch?.pdfBuffer !== undefined
        ? { pdf_buffer: bufferToBytes(patch.pdfBuffer) }
        : {}),
    },
  });
}

export async function generateStudentBriefingJob(
  jobId: string,
  args: { studentId: string; advisorName: string }
): Promise<void> {
  try {
    await markJobStatus(jobId, "generating");
    const result = await generateStudentBriefingPdf({
      studentId: args.studentId,
      advisorName: args.advisorName,
    });
    if (!result.found || !result.buffer) {
      await markJobStatus(jobId, "failed", { error: "Student not found" });
      return;
    }
    await markJobStatus(jobId, "ready", { pdfBuffer: result.buffer, error: null });
  } catch (err) {
    await markJobStatus(jobId, "failed", {
      error: err instanceof Error ? err.message : "Unknown PDF generation error",
    });
  }
}

export async function generateCohortSummaryJob(
  jobId: string,
  args: { advisorName: string; districtName: string }
): Promise<void> {
  try {
    await markJobStatus(jobId, "generating");
    const result = await generateCohortSummaryPdf({
      advisorName: args.advisorName,
      districtName: args.districtName,
    });
    await markJobStatus(jobId, "ready", { pdfBuffer: result.buffer, error: null });
  } catch (err) {
    await markJobStatus(jobId, "failed", {
      error: err instanceof Error ? err.message : "Unknown PDF generation error",
    });
  }
}

/**
 * Best-effort buffer cleanup after download.
 * The schema comment says we want a 1-hour TTL, but we also clear immediately
 * after a successful download to avoid storing duplicate copies of the binary
 * in Postgres if the same advisor exports many times.
 */
export async function clearPdfBuffer(jobId: string): Promise<void> {
  try {
    await prismaTtg.pdfExportJob.update({
      where: { id: jobId },
      data: { pdf_buffer: null },
    });
  } catch {
    // Non-fatal — TTL sweep can pick this up later.
  }
}

/**
 * POST /api/pdf/student
 *
 * Sprint 5 — accepts a student_id, creates a pdf_export_jobs row, kicks off
 * generation inline (a single student's briefing fits well under Vercel's 10s
 * limit), and returns 202 Accepted with a jobId. The client polls the status
 * endpoint and then downloads the buffer when ready.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { handleAuthError } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import {
  createPdfJob,
  generateStudentBriefingJob,
  markJobStatus,
} from "@/lib/pdf/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  student_id: z.string().min(1),
});

export async function POST(req: Request) {
  let session;
  try {
    session = await requireTtgSession();
  } catch (err) {
    return handleAuthError(err);
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "student_id is required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const job = await createPdfJob({
    advisorId: session.userId,
    jobType: "student_briefing",
    studentId: payload.student_id,
  });

  // Inline generation — single student briefings render well under 10s. We do
  // not await the lifecycle promise on the request thread to keep the 202
  // response snappy, but on serverless platforms without `waitUntil` the
  // promise still completes because the runtime keeps the function warm until
  // all in-flight async work resolves.
  const work = generateStudentBriefingJob(job.id, {
    studentId: payload.student_id,
    advisorName: session.name ?? session.email ?? "Advisor",
  }).catch(async (err) => {
    await markJobStatus(job.id, "failed", {
      error: err instanceof Error ? err.message : "PDF generation failed",
    });
  });
  // eslint-disable-next-line @typescript-eslint/no-floating-promises -- intentional fire-and-track
  void work;

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}

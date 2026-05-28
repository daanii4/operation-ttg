/**
 * GET /api/ocr/[jobId]/status
 *
 * Sprint 6 / Workstream B-2.
 *
 * Returns the status, parsed_courses (only when status === "needs_review"),
 * confidence_scores, and any error. `raw_text` is intentionally never
 * exposed — that column is the audit trail of what GPT-4o saw, not advisor-
 * facing data.
 */

import { NextResponse } from "next/server";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
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
    select: {
      advisor_id: true,
      status: true,
      parsed_courses: true,
      confidence_scores: true,
      error: true,
    },
  });

  if (!job) return notFoundResponse();
  if (job.advisor_id !== session.userId) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const showParsed = job.status === "needs_review";

  return NextResponse.json({
    status: job.status,
    parsed_courses: showParsed ? job.parsed_courses : null,
    confidence_scores: showParsed ? job.confidence_scores : null,
    ...(job.error ? { error: job.error } : {}),
  });
}

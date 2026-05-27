/**
 * POST /api/pdf/cohort
 *
 * Sprint 5 — kicks off a cohort PDF (cover sheet + per-student pages).
 * Generation runs as a fire-and-track background task so the request itself
 * returns 202 Accepted with a jobId immediately. The client polls the status
 * endpoint and downloads once status flips to `ready`.
 *
 * On Vercel, `waitUntil` from `next/server` keeps the function alive past the
 * response. When `waitUntil` is unavailable (local Node, edge runtimes, tests)
 * we fall back to letting the runtime drain the floating promise.
 */

import { NextResponse } from "next/server";
import { handleAuthError } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import {
  createPdfJob,
  generateCohortSummaryJob,
  markJobStatus,
} from "@/lib/pdf/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  let session;
  try {
    session = await requireTtgSession();
  } catch (err) {
    return handleAuthError(err);
  }

  const job = await createPdfJob({
    advisorId: session.userId,
    jobType: "cohort_summary",
  });

  const work = generateCohortSummaryJob(job.id, {
    advisorName: session.name ?? session.email ?? "Advisor",
    districtName: "Manteca Unified School District",
  }).catch(async (err) => {
    await markJobStatus(job.id, "failed", {
      error: err instanceof Error ? err.message : "PDF generation failed",
    });
  });
  // eslint-disable-next-line @typescript-eslint/no-floating-promises -- intentional fire-and-track
  void work;

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}

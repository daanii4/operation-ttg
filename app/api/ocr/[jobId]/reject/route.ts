/**
 * POST /api/ocr/[jobId]/reject
 *
 * Sprint 6 / Workstream B-2 — advisor discards the parsed result without
 * writing any CourseRecord rows. Marks the job as `rejected` so it stays in
 * the audit trail for the student.
 */

import { NextResponse } from "next/server";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
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
    select: { id: true, advisor_id: true, status: true },
  });
  if (!job) return notFoundResponse();
  if (job.advisor_id !== session.userId) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }
  if (job.status === "rejected" || job.status === "accepted") {
    return NextResponse.json({ data: { rejected: true } });
  }

  await prismaTtg.ocrJob.update({
    where: { id: job.id },
    data: { status: "rejected" },
  });

  return NextResponse.json({ data: { rejected: true } });
}

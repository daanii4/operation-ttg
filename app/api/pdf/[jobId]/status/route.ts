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

  const job = await prismaTtg.pdfExportJob.findUnique({
    where: { id: params.jobId },
    select: { advisor_id: true, status: true, error: true },
  });

  if (!job) return notFoundResponse();
  if (job.advisor_id !== session.userId) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    status: job.status,
    ...(job.error ? { error: job.error } : {}),
  });
}

import { NextResponse } from "next/server";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";
import { clearPdfBuffer } from "@/lib/pdf/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function filenameFor(jobType: string, studentId: string | null): string {
  const date = new Date().toISOString().slice(0, 10);
  if (jobType === "student_briefing") {
    return `student-briefing-${studentId ?? "unknown"}-${date}.pdf`;
  }
  return `cohort-summary-${date}.pdf`;
}

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
    select: {
      id: true,
      advisor_id: true,
      status: true,
      job_type: true,
      student_id: true,
      pdf_buffer: true,
    },
  });

  if (!job) return notFoundResponse();
  if (job.advisor_id !== session.userId) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    );
  }
  if (job.status !== "ready" || !job.pdf_buffer) {
    return NextResponse.json(
      { error: "PDF not ready", code: "NOT_READY" },
      { status: 409 }
    );
  }

  const filename = filenameFor(job.job_type, job.student_id);

  // Clear the buffer after streaming so we don't keep duplicate binary blobs
  // sitting in Postgres. Schedule it without blocking the response.
  void clearPdfBuffer(job.id);

  // Convert Prisma Bytes (Uint8Array | Buffer) into a plain Uint8Array so the
  // Response constructor can stream it without typing surprises.
  const buf = job.pdf_buffer instanceof Uint8Array
    ? job.pdf_buffer
    : new Uint8Array(job.pdf_buffer as unknown as ArrayBuffer);

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

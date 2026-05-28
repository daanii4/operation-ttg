/**
 * POST /api/students/[id]/ocr-transcript
 *
 * Sprint 6 / Workstream B-2 — OCR upload endpoint.
 *
 * Accepts a multipart/form-data request with a single `file` field. Validates
 * size + Content-Type + magic bytes (see lib/ocr/validation.ts), creates a
 * pending OcrJob row, persists the file to /tmp, then kicks off processing
 * in the background. Returns 202 Accepted with `{ jobId }` immediately so the
 * client can poll the status endpoint.
 */

import { NextResponse } from "next/server";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";
import { validateUploadedFile } from "@/lib/ocr/validation";
import {
  persistTempUpload,
  processOcrJob,
} from "@/lib/ocr/processOcrJob";
import { ALL_DEMO_STUDENTS } from "@/lib/seed/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requireTtgSession();
  } catch (err) {
    return handleAuthError(err);
  }

  // Confirm the student exists. We accept either DB rows or seed-cohort IDs
  // so the demo flow works without provisioning.
  const studentExists =
    (await prismaTtg.studentAthlete
      .findUnique({ where: { id: params.id }, select: { id: true } })
      .catch(() => null)) ??
    ALL_DEMO_STUDENTS.find((d) => d.student.id === params.id);
  if (!studentExists) return notFoundResponse();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Multipart upload required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file field", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateUploadedFile(file.type, bytes);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error.message, code: validation.error.code },
      { status: 400 }
    );
  }

  const job = await prismaTtg.ocrJob.create({
    data: {
      advisor_id: session.userId,
      student_id: params.id,
      status: "pending",
      source_filename: file.name || null,
    },
    select: { id: true },
  });

  const filePath = await persistTempUpload(job.id, bytes, validation.mime);

  // Fire and track. We don't await — the request needs to return 202 fast.
  // processOcrJob never throws; it lands the row in `failed` on error.
  void processOcrJob({ jobId: job.id, filePath, mime: validation.mime });

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}

/**
 * POST /api/students/[id]/ingest-transcript
 *
 * Sprint 7 / Workstream A-5 — owner-only Class A ingestion trigger.
 *
 * Returns:
 *   • 401 — no session
 *   • 403 — caller is not an owner (advisors and viewers cannot kick off
 *           ingestion; the data-class promotion path is owner-gated to
 *           prevent inadvertent contamination of the audit trail).
 *   • 503 — DATA_FEED_ENABLED !== 'true'
 *   • 200 — { data: { jobId, recordsWritten } } on success
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { hasPermission } from "@/lib/auth/ttg-permissions";
import {
  DataFeedDisabledError,
  isDataFeedEnabled,
} from "@/lib/ingestion/guards";
import { runClassAIngestion } from "@/lib/ingestion/runClassAIngestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requireTtgSession();
  } catch (err) {
    return handleApiError(err);
  }

  // Owner-gate before doing any DB or env work.
  const profile = await ensureAdvisorProfile(session).catch(() => null);
  if (!profile || !hasPermission(profile.teamRole, "team:manage")) {
    return NextResponse.json(
      { error: "Forbidden", code: "PERMISSION_DENIED" },
      { status: 403 }
    );
  }

  if (!isDataFeedEnabled()) {
    return NextResponse.json(
      {
        error: "Data feed ingestion is currently disabled.",
        code: "DATA_FEED_DISABLED",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runClassAIngestion({
      studentId: params.id,
      provider: "transcript_api",
      advisorId: session.userId,
    });

    return NextResponse.json({
      data: {
        jobId: result.jobId,
        status: result.status,
        recordsFetched: result.recordsFetched,
        recordsWritten: result.recordsWritten,
        error: result.error,
      },
    });
  } catch (err) {
    if (err instanceof DataFeedDisabledError) {
      return NextResponse.json(
        { error: err.message, code: "DATA_FEED_DISABLED" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Ingestion failed",
        code: "INGESTION_FAILED",
      },
      { status: 500 }
    );
  }
}

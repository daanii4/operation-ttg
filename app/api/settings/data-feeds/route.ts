/**
 * Sprint 7 / Workstream A-6 — Data Feeds settings status.
 *
 * Returns whether the Class A pipeline is enabled in this deployment +
 * the timestamp of the most recent successful ingestion. The flag itself
 * is set via env var only; this endpoint never modifies it.
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { isDataFeedEnabled } from "@/lib/ingestion/guards";
import { prismaTtg } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireTtgSession();
    const lastComplete = await prismaTtg.classAFeedJob
      .findFirst({
        where: { status: "complete" },
        orderBy: { updated_at: "desc" },
        select: {
          id: true,
          provider: true,
          updated_at: true,
          records_written: true,
        },
      })
      .catch(() => null);

    return NextResponse.json({
      data: {
        enabled: isDataFeedEnabled(),
        provider: "transcript_api",
        providerStatus: "stub-pending-mcp-2",
        lastIngestion: lastComplete
          ? {
              jobId: lastComplete.id,
              provider: lastComplete.provider,
              completedAt: lastComplete.updated_at.toISOString(),
              recordsWritten: lastComplete.records_written ?? 0,
            }
          : null,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

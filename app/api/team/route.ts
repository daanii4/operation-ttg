/**
 * GET /api/team
 *
 * Returns the team member roster + pending invites for the calling
 * advisor. Read-only — every authenticated user gets the same payload so
 * the Settings → Team tab can render in read-only mode for non-owners.
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { listTeam } from "@/lib/team/team-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireTtgSession();
    const snapshot = await listTeam(session);
    return NextResponse.json(snapshot);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/team/assignments — owner-only student assignment update.
 *
 * Body: { advisorId: string, studentIds: string[] }
 * Idempotent — replaces the advisor's assignment set with the supplied list.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { setStudentAssignments } from "@/lib/team/team-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  advisorId: z.string().min(1),
  studentIds: z.array(z.string().min(1)),
});

export async function POST(req: Request) {
  try {
    const session = await requireTtgSession();
    const body = bodySchema.parse(await req.json());
    const result = await setStudentAssignments(session, body);
    return NextResponse.json({ data: result });
  } catch (err) {
    return handleApiError(err);
  }
}

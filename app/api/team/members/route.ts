/**
 * PATCH /api/team/members        — change a team member's role
 * DELETE /api/team/members       — remove a team member (auto-reassign students)
 *
 * Owner-only. Both endpoints use a JSON body (DELETE accepts JSON since
 * Next.js route handlers parse it).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { changeTeamRole, removeTeamMember } from "@/lib/team/team-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  advisorId: z.string().min(1),
  role: z.enum(["owner", "advisor", "viewer"]),
});

const deleteSchema = z.object({
  advisorId: z.string().min(1),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireTtgSession();
    const body = patchSchema.parse(await req.json());
    await changeTeamRole(session, {
      targetAdvisorId: body.advisorId,
      nextRole: body.role,
    });
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    if (err instanceof Error && err.message === "Cannot demote the last owner") {
      return NextResponse.json(
        { error: err.message, code: "LAST_OWNER" },
        { status: 409 }
      );
    }
    return handleApiError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireTtgSession();
    const body = deleteSchema.parse(await req.json());
    const result = await removeTeamMember(session, body.advisorId);
    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof Error && err.message === "Cannot remove the last owner") {
      return NextResponse.json(
        { error: err.message, code: "LAST_OWNER" },
        { status: 409 }
      );
    }
    return handleApiError(err);
  }
}

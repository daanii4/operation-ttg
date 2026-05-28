/**
 * POST /api/team/invites — owner-only invite creation.
 *
 * Generates a UUID token, persists an AdvisorInvite row, and (when
 * RESEND_API_KEY is configured) sends an invite email. The response always
 * includes the accept URL so an owner can copy it manually if email
 * delivery fails or isn't configured locally.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { createTeamInvite } from "@/lib/team/team-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["advisor", "viewer"]).default("advisor"),
});

export async function POST(req: Request) {
  try {
    const session = await requireTtgSession();
    const body = bodySchema.parse(await req.json());

    const baseUrl =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const invite = await createTeamInvite(session, {
      email: body.email,
      role: body.role,
      baseUrl,
    });
    return NextResponse.json(
      {
        data: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
          emailDelivered: invite.emailDelivered,
          acceptUrl: invite.acceptUrl,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}

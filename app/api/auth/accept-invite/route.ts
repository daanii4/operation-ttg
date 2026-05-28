/**
 * GET /api/auth/accept-invite?token=...
 *
 * Sprint 6 / Workstream C-4. Validates the token, attaches the team role
 * to the accepting Supabase user, and redirects to the dashboard with a
 * welcome flag in the query string. The accepting user must already be
 * authenticated — if not, we redirect them to login first preserving the
 * accept-invite URL as the post-login destination.
 */

import { NextResponse } from "next/server";
import { getTtgSession } from "@/lib/auth/session";
import { acceptInvite } from "@/lib/team/team-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing invite token", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") {
    const login = new URL("/login", url.origin);
    login.searchParams.set("redirectTo", `/api/auth/accept-invite?token=${token}`);
    return NextResponse.redirect(login);
  }

  const result = await acceptInvite({ token, acceptingSession: session });
  if (!result.ok) {
    if (result.reason === "expired") {
      return NextResponse.json(
        { error: "Invite link has expired", code: "EXPIRED" },
        { status: 400 }
      );
    }
    if (result.reason === "already_accepted") {
      return NextResponse.json(
        { error: "Invite already accepted", code: "ALREADY_ACCEPTED" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Invite link not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const dashboard = new URL("/dashboard", url.origin);
  dashboard.searchParams.set("welcome", "1");
  dashboard.searchParams.set("role", result.teamRole);
  return NextResponse.redirect(dashboard);
}

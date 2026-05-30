import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { requireTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireTtgSession();
    const profile = await ensureAdvisorProfile(session);

    if (profile.teamRole !== "owner") {
      return NextResponse.json({ error: "Owner access required", code: "FORBIDDEN" }, { status: 403 });
    }

    const rows = await prismaTtg.thresholdAuditLog.findMany({
      orderBy: { changed_at: "desc" },
      take: 100,
    });

    const advisorIds = Array.from(new Set(rows.map((r) => r.changed_by)));
    const profiles =
      advisorIds.length > 0
        ? await prismaTtg.advisorProfile.findMany({
            where: { advisor_id: { in: advisorIds } },
            select: { advisor_id: true, display_name: true, email: true },
          })
        : [];
    const nameByAdvisor = new Map(
      profiles.map((p) => [
        p.advisor_id,
        p.display_name?.trim() || p.email?.split("@")[0] || "Advisor",
      ])
    );

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        thresholdKey: r.threshold_key,
        previousValue: r.previous_value,
        newValue: r.new_value,
        changedBy: nameByAdvisor.get(r.changed_by) ?? r.changed_by,
        changedAt: r.changed_at.toISOString(),
        reason: r.reason,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

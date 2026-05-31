import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { requireTtgSession } from "@/lib/auth/session";
import { counselorActionLabel } from "@/lib/briefings/counselor-escalation-action";
import { escalationLabel } from "@/lib/calculations/escalation-labels";
import {
  canAccessAcknowledgmentAudit,
  canViewStudentAcknowledgment,
} from "@/lib/settings/acknowledgment-access";
import { prismaTtg } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function reasonFromSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== "object") return "—";
  const s = snapshot as Record<string, unknown>;
  const f8 = s.f8 as { escalation_reason?: string; primary_concern?: string } | undefined;
  const code =
    (s.escalation_reason as string | undefined) ??
    f8?.escalation_reason ??
    f8?.primary_concern ??
    null;
  return escalationLabel(code);
}

export async function GET(req: Request) {
  try {
    const session = await requireTtgSession();
    const profile = await ensureAdvisorProfile(session);

    if (!canAccessAcknowledgmentAudit(profile.teamRole)) {
      return NextResponse.json(
        { error: "Acknowledgment records are visible to owners and assigned advisors only.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") ?? "all";

    const rows = await prismaTtg.compositeBandAcknowledgment.findMany({
      where: { counselor_action: { not: null } },
      orderBy: { acknowledged_at: "desc" },
      take: 200,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            advisorId: true,
          },
        },
      },
    });

    const advisorIds = Array.from(new Set(rows.map((r) => r.advisor_id)));
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

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    let mapped = rows
      .filter((row) =>
        canViewStudentAcknowledgment({
          teamRole: profile.teamRole,
          sessionUserId: session.userId,
          studentAdvisorId: row.student.advisorId,
          acknowledgingAdvisorId: row.advisor_id,
        })
      )
      .map((row) => {
        const snapshot = row.conditions_snapshot;
        const reEscalated =
          typeof snapshot === "object" &&
          snapshot !== null &&
          (snapshot as Record<string, unknown>).escalation_reason === "re_escalated_after_ack";

        return {
          id: row.id,
          studentId: row.student_id,
          athleteName: `${row.student.firstName} ${row.student.lastName}`,
          escalationReason: reasonFromSnapshot(snapshot),
          acknowledgedBy: nameByAdvisor.get(row.advisor_id) ?? "Advisor",
          acknowledgedAt: row.acknowledged_at.toISOString(),
          actionTaken: counselorActionLabel(row.counselor_action),
          counselorNotes: row.counselor_notes,
          reEscalated,
          conditionsSnapshot: snapshot,
        };
      });

    if (filter === "this_week") {
      mapped = mapped.filter((r) => new Date(r.acknowledgedAt).getTime() >= weekAgo);
    } else if (filter === "unactioned_24h") {
      mapped = mapped.filter((r) => new Date(r.acknowledgedAt).getTime() < dayAgo);
    }

    return NextResponse.json({ data: mapped });
  } catch (err) {
    return handleApiError(err);
  }
}

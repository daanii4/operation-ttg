import { NextResponse } from "next/server";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getStudentScope } from "@/lib/auth/student-scope";
import { requireTtgSession } from "@/lib/auth/session";
import { counselorActionLabel } from "@/lib/briefings/counselor-escalation-action";
import { prismaTtg } from "@/lib/prisma";
import { ALL_DEMO_STUDENTS } from "@/lib/seed/demo-data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTtgSession();
    const profile = await ensureAdvisorProfile(session);
    const scope = await getStudentScope(session.userId, profile.teamRole);

    const student = await prismaTtg.studentAthlete.findFirst({
      where:
        Object.keys(scope).length === 0
          ? { id: params.id }
          : { AND: [{ id: params.id }, scope] },
      select: { id: true },
    });

    if (!student) {
      const demo = ALL_DEMO_STUDENTS.find((row) => row.student.id === params.id);
      if (!demo) return notFoundResponse();
    }

    const rows = await prismaTtg.compositeBandAcknowledgment.findMany({
      where: {
        student_id: params.id,
        counselor_action: { not: null },
      },
      orderBy: { acknowledged_at: "desc" },
      take: 50,
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

    return NextResponse.json({
      data: rows.map((row) => ({
        id: row.id,
        acknowledgedAt: row.acknowledged_at.toISOString(),
        advisorId: row.advisor_id,
        advisorName: nameByAdvisor.get(row.advisor_id) ?? "Advisor",
        actionCode: row.counselor_action,
        actionLabel: counselorActionLabel(row.counselor_action),
        counselorNotes: row.counselor_notes,
      })),
    });
  } catch (err) {
    return handleAuthError(err);
  }
}

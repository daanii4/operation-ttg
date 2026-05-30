import { prismaTtg } from "@/lib/prisma";
import type { CounselorEscalationAction } from "@prisma/client";

export interface EscalationMeta {
  advisorId: string | null;
  latestAcknowledgment: {
    id: string;
    acknowledgedAt: string;
    advisorId: string;
    advisorName: string;
    counselorAction: CounselorEscalationAction | null;
    counselorNotes: string | null;
  } | null;
}

export async function loadEscalationMeta(studentId: string): Promise<EscalationMeta> {
  const [student, latestAck] = await Promise.all([
    prismaTtg.studentAthlete.findUnique({
      where: { id: studentId },
      select: { advisorId: true },
    }),
    prismaTtg.compositeBandAcknowledgment.findFirst({
      where: { student_id: studentId },
      orderBy: { acknowledged_at: "desc" },
    }),
  ]);

  let advisorName = "Advisor";
  if (latestAck) {
    const profile = await prismaTtg.advisorProfile.findUnique({
      where: { advisor_id: latestAck.advisor_id },
      select: { display_name: true, email: true },
    });
    advisorName =
      profile?.display_name?.trim() ||
      profile?.email?.split("@")[0] ||
      "Advisor";
  }

  return {
    advisorId: student?.advisorId ?? null,
    latestAcknowledgment: latestAck
      ? {
          id: latestAck.id,
          acknowledgedAt: latestAck.acknowledged_at.toISOString(),
          advisorId: latestAck.advisor_id,
          advisorName,
          counselorAction: latestAck.counselor_action,
          counselorNotes: latestAck.counselor_notes,
        }
      : null,
  };
}

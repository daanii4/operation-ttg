/**
 * Sprint 6 / Workstream C-4 — team service.
 *
 * Centralizes the read + mutate operations the Team management page needs.
 * Each mutate function asserts the caller's permission first, then runs in a
 * transaction so we never end up half-applied (e.g. role changed but the
 * student reassignment failed).
 *
 * Email sending is intentionally tolerant: when RESEND_API_KEY is missing
 * we log + continue without throwing so local dev / preview deployments
 * still let owners exercise the invite UI.
 */

import { randomUUID } from "node:crypto";
import type { AdvisorRole } from "@prisma/client";
import { prismaTtg } from "@/lib/prisma";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { assertPermission } from "@/lib/auth/ttg-permissions";
import type { TtgSession } from "@/lib/auth/session";

const INVITE_EXPIRY_DAYS = 7;

export interface TeamMember {
  advisorId: string;
  email: string | null;
  displayName: string | null;
  teamRole: AdvisorRole;
  studentsAssigned: number;
}

export interface TeamSnapshot {
  members: TeamMember[];
  invites: Array<{
    id: string;
    email: string;
    role: AdvisorRole;
    invitedBy: string;
    expiresAt: string;
  }>;
}

export async function listTeam(callerSession: TtgSession): Promise<TeamSnapshot> {
  const profile = await ensureAdvisorProfile(callerSession);
  // Read is allowed for every team member; no permission gate here. Mutations
  // below assert team:manage.

  const [profiles, assignments, invites] = await Promise.all([
    prismaTtg.advisorProfile.findMany({
      orderBy: { created_at: "asc" },
    }),
    prismaTtg.studentAdvisorAssignment.groupBy({
      by: ["advisor_id"],
      _count: { _all: true },
    }),
    prismaTtg.advisorInvite.findMany({
      where: { accepted: false },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const counts = new Map(
    assignments.map((a) => [a.advisor_id, a._count._all])
  );

  return {
    members: profiles.map((p) => ({
      advisorId: p.advisor_id,
      email: p.email,
      displayName: p.display_name,
      teamRole: p.team_role,
      studentsAssigned: counts.get(p.advisor_id) ?? 0,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      invitedBy: i.invited_by,
      expiresAt: i.expires_at.toISOString(),
    })),
  };
}

export async function changeTeamRole(
  callerSession: TtgSession,
  args: { targetAdvisorId: string; nextRole: AdvisorRole }
): Promise<void> {
  const callerProfile = await ensureAdvisorProfile(callerSession);
  assertPermission(callerProfile.teamRole, "team:manage");

  if (args.nextRole === "owner") {
    // Promotion to owner is allowed; the spec only restricts demotion of the
    // last owner.
  } else {
    // Block demoting the last remaining owner — the team would lose the
    // ability to manage itself.
    const targetProfile = await prismaTtg.advisorProfile.findUnique({
      where: { advisor_id: args.targetAdvisorId },
    });
    if (targetProfile?.team_role === "owner") {
      const ownerCount = await prismaTtg.advisorProfile.count({
        where: { team_role: "owner" },
      });
      if (ownerCount <= 1) {
        throw new Error("Cannot demote the last owner");
      }
    }
  }

  await prismaTtg.advisorProfile.update({
    where: { advisor_id: args.targetAdvisorId },
    data: { team_role: args.nextRole },
  });
}

export async function removeTeamMember(
  callerSession: TtgSession,
  targetAdvisorId: string
): Promise<{ removed: boolean; reassignedTo?: string }> {
  const callerProfile = await ensureAdvisorProfile(callerSession);
  assertPermission(callerProfile.teamRole, "team:manage");

  const target = await prismaTtg.advisorProfile.findUnique({
    where: { advisor_id: targetAdvisorId },
  });
  if (!target) return { removed: false };

  // Block removing the last owner.
  if (target.team_role === "owner") {
    const ownerCount = await prismaTtg.advisorProfile.count({
      where: { team_role: "owner" },
    });
    if (ownerCount <= 1) {
      throw new Error("Cannot remove the last owner");
    }
  }

  // Reassign their students to the caller (an owner) so we never leave
  // students orphaned. The spec offers either blocking removal or
  // auto-reassign — auto-reassign keeps the page interactive.
  const callerId = callerSession.userId;
  await prismaTtg.$transaction(async (tx) => {
    const assignments = await tx.studentAdvisorAssignment.findMany({
      where: { advisor_id: targetAdvisorId },
      select: { student_id: true },
    });
    for (const a of assignments) {
      // Only reassign if the caller doesn't already have an assignment for
      // this student (the @@unique constraint would fail otherwise).
      const existing = await tx.studentAdvisorAssignment.findUnique({
        where: {
          student_id_advisor_id: {
            student_id: a.student_id,
            advisor_id: callerId,
          },
        },
      });
      if (!existing) {
        await tx.studentAdvisorAssignment.create({
          data: {
            student_id: a.student_id,
            advisor_id: callerId,
            assigned_by: callerId,
          },
        });
      }
    }
    await tx.studentAdvisorAssignment.deleteMany({
      where: { advisor_id: targetAdvisorId },
    });
    await tx.advisorProfile.delete({ where: { id: target.id } });
  });

  return { removed: true, reassignedTo: callerId };
}

export async function setStudentAssignments(
  callerSession: TtgSession,
  args: { advisorId: string; studentIds: string[] }
): Promise<{ added: number; removed: number }> {
  const callerProfile = await ensureAdvisorProfile(callerSession);
  assertPermission(callerProfile.teamRole, "student:assign");

  return prismaTtg.$transaction(async (tx) => {
    const current = await tx.studentAdvisorAssignment.findMany({
      where: { advisor_id: args.advisorId },
      select: { student_id: true },
    });
    const currentIds = new Set(current.map((a) => a.student_id));
    const nextIds = new Set(args.studentIds);

    const toAdd = Array.from(nextIds).filter((id) => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter((id) => !nextIds.has(id));

    for (const studentId of toAdd) {
      await tx.studentAdvisorAssignment.create({
        data: {
          student_id: studentId,
          advisor_id: args.advisorId,
          assigned_by: callerSession.userId,
        },
      });
    }
    if (toRemove.length > 0) {
      await tx.studentAdvisorAssignment.deleteMany({
        where: {
          advisor_id: args.advisorId,
          student_id: { in: toRemove },
        },
      });
    }
    return { added: toAdd.length, removed: toRemove.length };
  });
}

export interface CreatedInvite {
  id: string;
  email: string;
  role: AdvisorRole;
  token: string;
  expiresAt: string;
  emailDelivered: boolean;
  acceptUrl: string;
}

export async function createTeamInvite(
  callerSession: TtgSession,
  args: { email: string; role: AdvisorRole; baseUrl: string }
): Promise<CreatedInvite> {
  const callerProfile = await ensureAdvisorProfile(callerSession);
  assertPermission(callerProfile.teamRole, "team:manage");

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prismaTtg.advisorInvite.create({
    data: {
      email: args.email.toLowerCase(),
      role: args.role,
      invited_by: callerSession.userId,
      token,
      expires_at: expiresAt,
    },
  });

  const acceptUrl = `${args.baseUrl.replace(/\/$/, "")}/api/auth/accept-invite?token=${token}`;
  const emailDelivered = await sendInviteEmail({
    email: invite.email,
    inviterName:
      callerProfile.displayName ?? callerSession.email ?? "An advisor",
    acceptUrl,
    role: args.role,
  });

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    token,
    expiresAt: invite.expires_at.toISOString(),
    emailDelivered,
    acceptUrl,
  };
}

async function sendInviteEmail(args: {
  email: string;
  inviterName: string;
  acceptUrl: string;
  role: AdvisorRole;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Local + preview environments without Resend configured still let the
    // owner copy the invite link from the response payload.
    console.info("[team] RESEND_API_KEY not set — invite email skipped", {
      email: args.email,
      acceptUrl: args.acceptUrl,
    });
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:
          process.env.RESEND_FROM_EMAIL ?? "Operation TTG <noreply@ttg.local>",
        to: [args.email],
        subject: "You're invited to Operation TTG",
        html: `
          <p>${escape(args.inviterName)} invited you to join their Operation TTG team as <strong>${args.role}</strong>.</p>
          <p><a href="${args.acceptUrl}">Accept invite</a></p>
          <p style="font-size:12px;color:#6B7280;">This link expires in ${INVITE_EXPIRY_DAYS} days.</p>
        `,
      }),
    });
    return response.ok;
  } catch (err) {
    console.error("[team] Resend email failed", err);
    return false;
  }
}

function escape(input: string): string {
  return input.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;"
  );
}

export async function acceptInvite(args: {
  token: string;
  acceptingSession: TtgSession;
}): Promise<
  | { ok: true; teamRole: AdvisorRole }
  | { ok: false; reason: "missing" | "expired" | "already_accepted" }
> {
  const invite = await prismaTtg.advisorInvite.findUnique({
    where: { token: args.token },
  });
  if (!invite) return { ok: false, reason: "missing" };
  if (invite.accepted) return { ok: false, reason: "already_accepted" };
  if (invite.expires_at.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  await prismaTtg.$transaction(async (tx) => {
    const profile = await tx.advisorProfile.findUnique({
      where: { advisor_id: args.acceptingSession.userId },
    });
    if (profile) {
      await tx.advisorProfile.update({
        where: { id: profile.id },
        data: {
          team_role: invite.role,
          email: args.acceptingSession.email ?? profile.email,
          display_name: args.acceptingSession.name ?? profile.display_name,
        },
      });
    } else {
      await tx.advisorProfile.create({
        data: {
          advisor_id: args.acceptingSession.userId,
          team_role: invite.role,
          email: args.acceptingSession.email ?? invite.email,
          display_name: args.acceptingSession.name ?? null,
        },
      });
    }
    await tx.advisorInvite.update({
      where: { id: invite.id },
      data: { accepted: true },
    });
  });

  return { ok: true, teamRole: invite.role };
}

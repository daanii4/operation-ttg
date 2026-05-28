/**
 * Sprint 6 / Workstream C — AdvisorProfile lifecycle helpers.
 *
 * Lazy ensure-on-read pattern: the first time an advisor hits the dashboard
 * after the migration, we upsert a profile row keyed by their Supabase
 * `userId`. The default team_role is `owner` for the FIRST profile ever
 * created in the database (single-advisor backwards compatibility) and
 * `advisor` for every profile after that. New profiles created via invite
 * accept supply the role explicitly.
 *
 * Why "first profile = owner"? Sprint 6's invariant is that single-advisor
 * sessions already in production must keep working. Defaulting the inaugural
 * profile to `owner` means existing solo deployments see all students; once
 * they add a second advisor, that second advisor defaults to `advisor` and
 * the scoping rules kick in.
 */

import type { AdvisorRole } from "@prisma/client";
import { prismaTtg } from "@/lib/prisma";
import type { TtgSession } from "./session";

export interface AdvisorProfileSnapshot {
  id: string;
  advisorId: string;
  teamRole: AdvisorRole;
  displayName: string | null;
  email: string | null;
}

export async function ensureAdvisorProfile(
  session: TtgSession
): Promise<AdvisorProfileSnapshot> {
  const existing = await prismaTtg.advisorProfile.findUnique({
    where: { advisor_id: session.userId },
  });
  if (existing) {
    // Best-effort backfill of email / display_name on every read; the writes
    // are idempotent and let owners audit the team list later.
    if (
      (session.email && existing.email !== session.email) ||
      (session.name && existing.display_name !== session.name)
    ) {
      await prismaTtg.advisorProfile
        .update({
          where: { id: existing.id },
          data: {
            email: session.email ?? existing.email,
            display_name: session.name ?? existing.display_name,
          },
        })
        .catch(() => undefined);
    }
    return toSnapshot(existing);
  }

  // First profile in the database becomes the owner — see file-level docs.
  const total = await prismaTtg.advisorProfile.count();
  const teamRole: AdvisorRole = total === 0 ? "owner" : "advisor";

  const created = await prismaTtg.advisorProfile.create({
    data: {
      advisor_id: session.userId,
      team_role: teamRole,
      email: session.email ?? null,
      display_name: session.name ?? null,
    },
  });
  return toSnapshot(created);
}

export async function getAdvisorProfile(
  advisorId: string
): Promise<AdvisorProfileSnapshot | null> {
  const row = await prismaTtg.advisorProfile.findUnique({
    where: { advisor_id: advisorId },
  });
  return row ? toSnapshot(row) : null;
}

function toSnapshot(row: {
  id: string;
  advisor_id: string;
  team_role: AdvisorRole;
  display_name: string | null;
  email: string | null;
}): AdvisorProfileSnapshot {
  return {
    id: row.id,
    advisorId: row.advisor_id,
    teamRole: row.team_role,
    displayName: row.display_name,
    email: row.email,
  };
}

/**
 * Sprint 7 / Workstream T-5 — threshold management API.
 *
 *   GET    /api/settings/thresholds       — read every global threshold
 *   PATCH  /api/settings/thresholds       — owner-only edit of a single value
 *
 * Owner-only mutations; all roles can read so the read-only Settings view
 * still shows the calibrated values to non-owners.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { hasPermission } from "@/lib/auth/ttg-permissions";
import { prismaTtg } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireTtgSession();
    const rows = await prismaTtg.thresholdConfig.findMany({
      where: { conference: null },
      orderBy: { key: "asc" },
    });
    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        key: r.key,
        value: r.value,
        description: r.description,
        ticket: r.ticket,
        calibratedBy: r.calibrated_by,
        calibratedAt: r.calibrated_at?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.number().finite(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireTtgSession();
    const profile = await ensureAdvisorProfile(session);
    if (!hasPermission(profile.teamRole, "team:manage")) {
      return NextResponse.json(
        { error: "Forbidden", code: "PERMISSION_DENIED" },
        { status: 403 }
      );
    }

    const body = patchSchema.parse(await req.json());

    const existing = await prismaTtg.thresholdConfig.findFirst({
      where: { key: body.key, conference: null },
    });
    if (!existing) {
      return NextResponse.json(
        {
          error: `Threshold '${body.key}' not seeded — run npm run seed:thresholds`,
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const updated = await prismaTtg.thresholdConfig.update({
      where: { id: existing.id },
      data: {
        value: body.value,
        calibrated_by: session.userId,
        calibrated_at: new Date(),
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        key: updated.key,
        value: updated.value,
        calibratedAt: updated.calibrated_at?.toISOString() ?? null,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

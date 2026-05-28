/**
 * GET /api/schools — high schools for student intake dropdowns.
 */

import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/api-permission-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { prismaTtg } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireTtgSession();

    const schools = await prismaTtg.highSchool.findMany({
      select: { id: true, schoolName: true, city: true },
      orderBy: { schoolName: "asc" },
    });

    return NextResponse.json({ data: schools });
  } catch (err) {
    return handleApiError(err);
  }
}

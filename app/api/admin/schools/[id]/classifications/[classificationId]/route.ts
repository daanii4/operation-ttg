import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaTtg } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import {
  badRequestResponse,
  handleAuthError,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/auth/api-errors";

const PatchSchema = z.object({
  countsGeometryForNcaa: z.boolean().optional(),
  countsGeometryForAg: z.boolean().optional(),
  countsLabForAg: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  {
    params,
  }: { params: { id: string; classificationId: string } }
) {
  try {
    try {
      await requireAdminSession();
    } catch {
      return unauthorizedResponse();
    }

    const row = await prismaTtg.courseClassification.findFirst({
      where: {
        id: params.classificationId,
        highSchoolId: params.id,
      },
    });
    if (!row) return notFoundResponse();

    const json = await req.json();
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.message);
    }

    const updated = await prismaTtg.courseClassification.update({
      where: { id: params.classificationId },
      data: parsed.data,
    });

    return NextResponse.json({ classification: updated });
  } catch (err) {
    return handleAuthError(err);
  }
}

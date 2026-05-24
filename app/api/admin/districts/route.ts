import { NextResponse } from "next/server";
import { z } from "zod";
import { prismaTtg } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import {
  badRequestResponse,
  handleAuthError,
} from "@/lib/auth/api-errors";

const BodySchema = z.object({
  districtName: z.string().min(1),
  state: z.string().default("CA"),
  ucDistrictId: z.string().optional(),
  schools: z
    .array(
      z.object({
        schoolName: z.string().min(1),
        ceebCode: z.string().min(1),
        ucInstitutionId: z.string().optional(),
        city: z.string().optional(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    await requireAdminSession();

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.message);
    }

    const { districtName, state, ucDistrictId, schools } = parsed.data;

    const result = await prismaTtg.$transaction(async (tx) => {
      const district = await tx.district.create({
        data: {
          districtName,
          state,
          ucDistrictId: ucDistrictId ?? null,
        },
      });

      for (const school of schools) {
        await tx.highSchool.create({
          data: {
            districtId: district.id,
            schoolName: school.schoolName,
            ceebCode: school.ceebCode,
            ucInstitutionId: school.ucInstitutionId ?? null,
            city: school.city ?? null,
            state,
            courseNameAliases: {},
          },
        });
      }

      return { districtId: district.id, schoolCount: schools.length };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return badRequestResponse("CEEB code must be unique across schools");
    }
    return handleAuthError(err);
  }
}

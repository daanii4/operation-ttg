import { TargetDivision } from "@prisma/client";
import { z } from "zod";

export const StudentIntakeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    grade: z.coerce.number().int().min(6).max(12),
    targetDivision: z.nativeEnum(TargetDivision),
    highSchoolId: z.string().min(1),
    enrollmentDateGrade9: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  })
  .strip();

export type StudentIntakeInput = z.infer<typeof StudentIntakeSchema>;

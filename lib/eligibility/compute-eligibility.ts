import { calcAgCompletion } from "@/lib/calculations/f1";
import { calcAgGpa } from "@/lib/calculations/f2";
import { calcNcaaD1Completion } from "@/lib/calculations/f3";
import { calcNcaaD1Gpa } from "@/lib/calculations/f4";
import { calcNcaaD2Completion } from "@/lib/calculations/f6";
import { calcNcaaD2Gpa } from "@/lib/calculations/f7";
import type { ClassifiedCourse, StudentInput } from "@/lib/calculations/types";
import type { F1Result } from "@/lib/calculations/f1";
import type { F2Result } from "@/lib/calculations/f2";
import type { F3Result } from "@/lib/calculations/f3";
import type { F4Result } from "@/lib/calculations/f4";
import type { F6Result } from "@/lib/calculations/f6";
import type { F7Result } from "@/lib/calculations/f7";

export interface EligibilityBundle {
  f1: F1Result;
  f2: F2Result;
  f3: F3Result;
  f4: F4Result;
  f6: F6Result;
  f7: F7Result;
  computedAt: string;
}

export function computeEligibilityBundle(
  student: StudentInput,
  courses: ClassifiedCourse[],
  graduationDate?: Date | null
): EligibilityBundle {
  const computedAt = new Date();
  return {
    f1: calcAgCompletion(student, courses),
    f2: calcAgGpa(student, courses),
    f3: calcNcaaD1Completion(student, courses, graduationDate),
    f4: calcNcaaD1Gpa(student, courses),
    f6: calcNcaaD2Completion(student, courses),
    f7: calcNcaaD2Gpa(student, courses),
    computedAt: computedAt.toISOString(),
  };
}

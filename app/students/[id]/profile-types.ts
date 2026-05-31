import type { BriefingPayload } from "@/app/dashboard/briefings/_components/use-briefing-data";
import type { F1Result } from "@/lib/calculations/f1";
import type { F3Result } from "@/lib/calculations/f3";
import type { F4Result } from "@/lib/calculations/f4";
import type { F6Result } from "@/lib/calculations/f6";
import type { F7Result } from "@/lib/calculations/f7";

export type ProfileCourse = {
  id: string;
  courseName: string;
  gradeLetterNormalized: string;
  term: string | null;
  termEndDate: string;
  termLength: string;
  academicYear: string | null;
  dataSourceClass: string;
  ncaaD1Category: string | null;
};

export type ProfileStudent = {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  targetDivision: string;
  highSchoolName: string;
  districtName: string | null;
  sport: string;
  advisorId: string | null;
  courses: ProfileCourse[];
};

/** Eligibility API shape — bundle (f1–f7) plus f8–f12 and ml. */
export type ProfileEligibilityPayload = BriefingPayload & {
  f1?: F1Result;
  f3?: F3Result;
  f4?: F4Result;
  f6?: F6Result;
  f7?: F7Result;
};

export type ProfileTab = "overview" | "eligibility" | "trajectory" | "transcript";

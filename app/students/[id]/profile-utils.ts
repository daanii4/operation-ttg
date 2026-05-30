import type { ProfileEligibilityPayload, ProfileStudent } from "./profile-types";

const REFERENCE_GRAD_YEAR = 2026;

export function gradeToGradYear(grade: number): number {
  return REFERENCE_GRAD_YEAR + Math.max(0, 12 - grade);
}

export function formatTargetDivision(value: string): string {
  switch (value) {
    case "DI":
      return "NCAA D1";
    case "DII":
      return "NCAA D2";
    case "DI_or_DII_undecided":
      return "D1 / D2";
    case "DIII":
      return "NCAA D3";
    case "NAIA":
      return "NAIA";
    default:
      return "Undecided";
  }
}

export function profileQuickStats(
  student: ProfileStudent,
  eligibility: ProfileEligibilityPayload | null
): { gpa: string; credits: string } {
  const f4 = eligibility?.f4;
  const f3 = eligibility?.f3;
  const gpa =
    f4?.applicable && f4.coreGpaWeighted != null
      ? f4.coreGpaWeighted.toFixed(2)
      : averageCourseGrade(student) ?? "—";
  const credits =
    f3?.applicable
      ? `${f3.totalCompleted}/${f3.totalRequired}`
      : student.courses.length > 0
        ? `${student.courses.length}/16`
        : "—";
  return { gpa, credits };
}

function averageCourseGrade(student: ProfileStudent): string | null {
  const grades = student.courses
    .map((c) => c.gradeLetterNormalized?.trim().charAt(0).toUpperCase())
    .filter(Boolean);
  if (grades.length === 0) return null;
  const points: Record<string, number> = {
    A: 4,
    B: 3,
    C: 2,
    D: 1,
    F: 0,
  };
  let sum = 0;
  let count = 0;
  for (const g of grades) {
    const p = points[g!];
    if (p == null) continue;
    sum += p;
    count += 1;
  }
  if (count === 0) return null;
  return (sum / count).toFixed(2);
}

export function studentInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

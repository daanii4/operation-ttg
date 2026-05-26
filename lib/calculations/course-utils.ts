/**
 * Shared helpers used across F1–F7. Pure functions — no DB, no network.
 */

import type { ClassifiedCourse } from "./types";

const GRADE_POINTS: Record<string, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
};

export function gradeToPoints(grade: string): number | null {
  if (grade === "IP") return null;
  return GRADE_POINTS[grade] ?? null;
}

export function yearsValue(termLength: ClassifiedCourse["termLength"]): number {
  switch (termLength) {
    case "year":
      return 1.0;
    case "semester":
      return 0.5;
    case "trimester":
      return 1 / 3;
    case "quarter":
      return 0.25;
  }
}

export function semestersValue(termLength: ClassifiedCourse["termLength"]): number {
  return yearsValue(termLength) * 2;
}

export function stripPlusMinus(grade: string): string {
  return grade.replace(/[+-]$/, "");
}

export function dedupeKeepBestGrade(
  courses: ClassifiedCourse[],
  applyR2: boolean = false
): ClassifiedCourse[] {
  const grouped = new Map<string, ClassifiedCourse[]>();
  for (const c of courses) {
    const key = c.courseNameNormalized;
    const group = grouped.get(key) ?? [];
    group.push(c);
    grouped.set(key, group);
  }
  const result: ClassifiedCourse[] = [];
  for (const group of Array.from(grouped.values())) {
    const sorted = [...group].sort(
      (a, b) => (a.termEndDate?.getTime() ?? 0) - (b.termEndDate?.getTime() ?? 0)
    );
    const original = sorted[0];
    if (
      applyR2 &&
      original.ucApprovedHonors &&
      (original.gradeLetterNormalized === "D" || original.gradeLetterNormalized === "F")
    ) {
      const honorsRetakes = sorted.slice(1).filter((c) => c.ucApprovedHonors);
      if (honorsRetakes.length === 0) {
        result.push(original);
        continue;
      }
      result.push(bestGrade(honorsRetakes));
    } else {
      result.push(bestGrade(sorted));
    }
  }
  return result;
}

function bestGrade(courses: ClassifiedCourse[]): ClassifiedCourse {
  return courses.reduce((best, c) => {
    const bp = gradeToPoints(best.gradeLetterNormalized) ?? -1;
    const cp = gradeToPoints(c.gradeLetterNormalized) ?? -1;
    if (cp > bp) return c;
    if (
      cp === bp &&
      (c.termEndDate?.getTime() ?? 0) > (best.termEndDate?.getTime() ?? 0)
    ) {
      return c;
    }
    return best;
  });
}

export function isClassificationStale(lastVerifiedDate: Date | null): boolean {
  if (!lastVerifiedDate) return true;
  const msSince = Date.now() - lastVerifiedDate.getTime();
  return msSince > 365 * 24 * 60 * 60 * 1000;
}

export function isInAgGpaWindow(
  course: ClassifiedCourse,
  enrollmentDateGrade9: Date
): boolean {
  if (!course.termEndDate) return false;
  if (course.gradeLetterNormalized === "IP") return false;
  const endOf9th = new Date(enrollmentDateGrade9);
  endOf9th.setFullYear(endOf9th.getFullYear() + 1);
  const summerAfter11th = new Date(enrollmentDateGrade9);
  summerAfter11th.setFullYear(summerAfter11th.getFullYear() + 3);
  return course.termEndDate > endOf9th && course.termEndDate <= summerAfter11th;
}

export function isInNcaaWindow(
  course: ClassifiedCourse,
  enrollmentDateGrade9: Date
): boolean {
  if (!course.termEndDate) return false;
  if (course.gradeLetterNormalized === "IP") return false;
  const windowEnd = new Date(enrollmentDateGrade9);
  windowEnd.setFullYear(windowEnd.getFullYear() + 4);
  return course.termEndDate >= enrollmentDateGrade9 && course.termEndDate <= windowEnd;
}

import type { HighSchool } from "@prisma/client";
import type { F5SchoolCalendar } from "@/lib/calculations/f5";

/** Maps a D2 HighSchool row to the plain F5SchoolCalendar interface (f5.ts unchanged). */
export function highSchoolToF5Calendar(school: HighSchool): F5SchoolCalendar | null {
  if (!school.seniorFallTermStart) return null;
  return {
    seniorFallTermStart: school.seniorFallTermStart,
    summerTermEndDate: school.summerTermEnd ?? undefined,
    maxCoresPerTerm: school.maxCoresPerTerm,
    maxEmsPerTerm: school.maxEmsPerTerm,
    calendarSourceUrl: school.calendarSourceUrl,
  };
}

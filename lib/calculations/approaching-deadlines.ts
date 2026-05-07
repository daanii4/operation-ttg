import { differenceInDays } from "date-fns";
import type { CohortStudentRow } from "@/app/api/cohort/route";
import type { HolisticStudentRisk } from "./holistic-rollup";
import type { DeadlineCategory, DeadlineRegistryEntry } from "@/lib/seed/deadlines";

export type ApproachingDeadlineAffectedStudent = {
  studentId: string;
  firstName: string;
  lastName: string;
};

export type ApproachingDeadline = {
  id: string;
  name: string;
  category: DeadlineCategory;
  label: string;
  date: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  daysRemaining: number;
  weeksRemaining: number;
  affectedStudentIds: string[];
  /** Resolved from cohort rows for UI drilldown (same order as IDs). */
  affectedStudents: ApproachingDeadlineAffectedStudent[];
};

function resolveDeadlineDate(raw: string, today: Date): Date {
  if (!raw.startsWith("ANNUAL-")) return new Date(raw);
  const [, month, day] = raw.split("-");
  const year = today.getFullYear();
  const thisYear = new Date(`${year}-${month}-${day}T00:00:00`);
  if (thisYear >= today) return thisYear;
  return new Date(`${year + 1}-${month}-${day}T00:00:00`);
}

export function computeApproachingDeadlines({
  today,
  students,
  holisticRows,
  deadlines,
  take = 10,
}: {
  today: Date;
  students: CohortStudentRow[];
  holisticRows: HolisticStudentRisk[];
  deadlines: DeadlineRegistryEntry[];
  take?: number;
}): ApproachingDeadline[] {
  const holisticById = new Map(holisticRows.map((row) => [row.studentId, row]));

  return deadlines
    .map((deadline) => {
      const affected = students.filter((student) => {
        const holistic = holisticById.get(student.studentId);
        if (!holistic) return false;
        return deadline.appliesTo({ student, holistic });
      });
      const affectedStudentIds = affected.map((student) => student.studentId);
      const affectedStudents: ApproachingDeadlineAffectedStudent[] = affected
        .map((student) => ({
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
        }))
        .sort((a, b) => {
          const last = a.lastName.localeCompare(b.lastName);
          if (last !== 0) return last;
          return a.firstName.localeCompare(b.firstName);
        });

      const resolvedDate = resolveDeadlineDate(deadline.date, today);
      const daysRemaining = differenceInDays(resolvedDate, today);

      return {
        id: deadline.id,
        name: deadline.name,
        category: deadline.category,
        label: deadline.label,
        date: resolvedDate.toISOString().slice(0, 10),
        description: deadline.description,
        sourceLabel: deadline.sourceLabel,
        sourceUrl: deadline.sourceUrl,
        daysRemaining,
        weeksRemaining: Math.max(0, Math.ceil(daysRemaining / 7)),
        affectedStudentIds,
        affectedStudents,
      };
    })
    .filter((deadline) => deadline.daysRemaining >= 0 && deadline.affectedStudentIds.length > 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, take);
}

/**
 * Joins a student's raw transcript CourseRecords against the school's
 * CourseClassification catalog, producing the F5CourseRecord[] that
 * calcNcaa107Status() expects.
 */
import { resolveCourseName } from "@/lib/utils/course-normalize";
import type { F5CourseRecord } from "@/lib/calculations/f5";

export interface RawTranscriptCourse {
  id: string;
  courseName: string;
  gradeLetterNormalized: string;
  termEndDate: Date;
}

export interface ClassificationRow {
  courseNameNormalized: string;
  ncaaD1Category: string | null;
  ncaaApproved: boolean;
  agCategory: string | null;
  lastVerifiedDate: Date;
}

/**
 * Returns F5-ready course records. A transcript course with no matching
 * classification is returned with ncaaD1Category=null and ncaaApproved=false.
 */
export function classifyCourses(
  transcript: RawTranscriptCourse[],
  classifications: ClassificationRow[],
  aliasMap: Record<string, string> | null
): F5CourseRecord[] {
  const byName = new Map<string, ClassificationRow>();
  for (const row of classifications) {
    byName.set(row.courseNameNormalized, row);
  }

  return transcript.map((t) => {
    const resolved = resolveCourseName(t.courseName, aliasMap);
    const match = byName.get(resolved);
    return {
      id: t.id,
      courseName: t.courseName,
      gradeLetterNormalized: t.gradeLetterNormalized,
      termEndDate: t.termEndDate,
      ncaaD1Category: match?.ncaaD1Category ?? null,
      ncaaApproved: match?.ncaaApproved ?? false,
      agCategory: match?.agCategory ?? null,
      classificationUpdatedAt: match?.lastVerifiedDate ?? null,
    };
  });
}

/**
 * Course-name normalization — D2 §7 join-key contract.
 *
 * Stage 1: normalizeCourseName — deterministic string cleanup.
 * Stage 2: resolveCourseName   — applies a school-specific alias map
 *          (HighSchool.courseNameAliases) on top of stage 1.
 *
 * F5, and future F1/F3, MUST call resolveCourseName() before comparing a
 * transcript course name against CourseClassification.courseNameNormalized.
 */

/** Stage 1 — deterministic cleanup. Preserved from D2 §7 current implementation. */
export function normalizeCourseName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\./g, "")
    .replace(/\s*&\s*/g, " and ");
}

/**
 * Stage 2 — apply the school's alias map.
 * aliasMap keys and values are both already stage-1 normalized.
 */
export function resolveCourseName(
  rawName: string,
  aliasMap: Record<string, string> | null | undefined
): string {
  const base = normalizeCourseName(rawName);
  if (!aliasMap) return base;
  return aliasMap[base] ?? base;
}

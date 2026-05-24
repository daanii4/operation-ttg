/**
 * Parsers for course tables pasted from the NCAA HS Portal and UC A-G CMP.
 * Pure functions — no network, no DB.
 */

import { normalizeCourseName } from "@/lib/utils/course-normalize";

export interface ParsedNcaaCourse {
  courseNameDisplay: string;
  ncaaCategoryRaw: string;
  ncaaD1Category: string | null;
  ncaaApprovedHonors: boolean;
  approved: boolean;
}

export interface ParsedAgCourse {
  courseNameDisplay: string;
  agCategoryRaw: string;
  agCategory: string | null;
  ucApprovedHonors: boolean;
  status: string;
}

export interface SkippedRow {
  line: string;
  reason: string;
}

export interface ParseNcaaResult {
  courses: ParsedNcaaCourse[];
  skipped: SkippedRow[];
}

export interface ParseAgResult {
  courses: ParsedAgCourse[];
  skipped: SkippedRow[];
}

const NCAA_CATEGORY_MAP: Record<string, string> = {
  english: "eng",
  mathematics: "math",
  "natural/physical science": "sci",
  "natural science": "sci",
  "physical science": "sci",
  science: "sci",
  "additional english/math/science": "addl_ems",
  "additional english": "addl_ems",
  "additional math": "addl_ems",
  "additional science": "addl_ems",
  "social science": "soc_sci",
};

const AG_CATEGORY_MAP: Record<string, string> = {
  "history/social science": "a",
  "social science": "a",
  history: "a",
  english: "b",
  mathematics: "c",
  math: "c",
  "laboratory science": "d",
  science: "d",
  "language other than english": "e",
  "world language": "e",
  "visual/performing arts": "f",
  "visual and performing arts": "f",
  "college-preparatory elective": "g",
  elective: "g",
};

function normalizeCategoryKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapNcaaCategory(raw: string): string | null {
  const key = normalizeCategoryKey(raw);
  if (NCAA_CATEGORY_MAP[key]) return NCAA_CATEGORY_MAP[key];
  for (const [pattern, value] of Object.entries(NCAA_CATEGORY_MAP)) {
    if (key.includes(pattern)) return value;
  }
  if (key.length > 0 && !key.includes("not approved") && !key.includes("on hold")) {
    return "addl_any";
  }
  return null;
}

function mapAgCategory(raw: string): string | null {
  const key = normalizeCategoryKey(raw);
  if (AG_CATEGORY_MAP[key]) return AG_CATEGORY_MAP[key];
  for (const [pattern, value] of Object.entries(AG_CATEGORY_MAP)) {
    if (key.includes(pattern)) return value;
  }
  return null;
}

function splitRow(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((c) => c.trim());
  }
  return line.split(/\s{2,}/).map((c) => c.trim());
}

function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.startsWith("course") ||
    lower.includes("subject area") ||
    lower.includes("a-g") ||
    lower === "title"
  );
}

export function parseNcaaCourseTable(pasted: string): ParseNcaaResult {
  const courses: ParsedNcaaCourse[] = [];
  const skipped: SkippedRow[] = [];

  const lines = pasted
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (isHeaderLine(line)) continue;

    const cols = splitRow(line);
    if (cols.length < 2) {
      skipped.push({ line, reason: "expected at least course name and subject columns" });
      continue;
    }

    const courseNameDisplay = cols[0];
    if (!courseNameDisplay) {
      skipped.push({ line, reason: "missing course name" });
      continue;
    }

    const statusCol = cols[cols.length - 1]?.toLowerCase() ?? "";
    const ncaaCategoryRaw = cols.length >= 3 ? cols[1] : cols[1];
    const onHold =
      statusCol.includes("on hold") ||
      statusCol.includes("not approved") ||
      line.toLowerCase().includes("on hold");

    const ncaaD1Category = onHold ? null : mapNcaaCategory(ncaaCategoryRaw);

    const honors =
      courseNameDisplay.toLowerCase().includes("ap ") ||
      courseNameDisplay.toLowerCase().includes("honors") ||
      courseNameDisplay.toLowerCase().startsWith("ap ");

    courses.push({
      courseNameDisplay,
      ncaaCategoryRaw,
      ncaaD1Category: onHold ? null : ncaaD1Category,
      ncaaApprovedHonors: honors,
      approved: !onHold && ncaaD1Category !== null,
    });
  }

  return { courses, skipped };
}

export function parseAgCourseTable(pasted: string): ParseAgResult {
  const courses: ParsedAgCourse[] = [];
  const skipped: SkippedRow[] = [];

  const lines = pasted
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (isHeaderLine(line)) continue;

    const cols = splitRow(line);
    if (cols.length < 2) {
      skipped.push({ line, reason: "expected at least course name and subject columns" });
      continue;
    }

    const courseNameDisplay = cols[0];
    if (!courseNameDisplay) {
      skipped.push({ line, reason: "missing course name" });
      continue;
    }

    const agCategoryRaw = cols[1];
    const statusRaw = (cols[2] ?? "active").toLowerCase();
    const agCategory = mapAgCategory(agCategoryRaw);

    if (!agCategory) {
      skipped.push({ line, reason: `unmapped A-G subject: ${agCategoryRaw}` });
      continue;
    }

    const honors =
      courseNameDisplay.toLowerCase().includes("honors") ||
      courseNameDisplay.toLowerCase().includes(" ap ");

    courses.push({
      courseNameDisplay,
      agCategoryRaw,
      agCategory,
      ucApprovedHonors: honors,
      status: statusRaw.includes("archived")
        ? "archived"
        : statusRaw.includes("review")
          ? "under_review"
          : "active",
    });
  }

  return { courses, skipped };
}

/** Exported for import route — builds normalized join key from display name. */
export { normalizeCourseName };

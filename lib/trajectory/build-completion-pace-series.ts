import type { F5Result } from "@/lib/calculations/f5";

export type PacePeriod = "month" | "term" | "year";

export type PaceCourseInput = {
  id: string;
  courseName: string;
  gradeLetterNormalized: string;
  termEndDate: string | Date;
  ncaaD1Category: string | null;
  ncaaApproved: boolean;
};

export type PaceTermPoint = {
  key: string;
  label: string;
  cumulativeTotal: number;
  cumulativeEms: number;
  isCurrent: boolean;
};

export type PaceChartModel = {
  points: PaceTermPoint[];
  paceTotal: Array<{ key: string; targetTotal: number }>;
  paceEms: Array<{ key: string; targetEms: number }> | null;
  lockLabel: string | null;
  lockKey: string | null;
  pastLock: boolean;
  behindPace: boolean;
  showEmsLine: boolean;
  requiredTotal: number;
  requiredEms: number;
};

const PASSING = new Set(["A", "B", "C", "D"]);
const EMS = new Set(["eng", "math", "sci", "addl_ems"]);

function termKey(date: Date, period: PacePeriod): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  if (period === "year") return String(y);
  if (period === "month") return `${y}-${String(m + 1).padStart(2, "0")}`;
  const startYear = m < 6 ? y - 1 : y;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function termLabel(key: string, period: PacePeriod): string {
  if (period === "year") return key;
  if (period === "month") {
    const [y, mo] = key.split("-");
    const d = new Date(Number(y), Number(mo) - 1, 1);
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return key;
}

function countedCourses(
  courses: PaceCourseInput[],
  lockInDate: Date | null
): PaceCourseInput[] {
  const lock = lockInDate ?? new Date("2099-01-01");
  const passing = courses.filter((c) => {
    if (!c.ncaaApproved || !c.ncaaD1Category) return false;
    const g = c.gradeLetterNormalized.toUpperCase();
    if (!PASSING.has(g) || g === "IP") return false;
    const end = new Date(c.termEndDate);
    return end < lock;
  });
  const best = new Map<string, PaceCourseInput>();
  const order: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
  for (const c of passing) {
    const prev = best.get(c.courseName);
    if (!prev) {
      best.set(c.courseName, c);
      continue;
    }
    const pg = order[prev.gradeLetterNormalized.toUpperCase()] ?? 0;
    const cg = order[c.gradeLetterNormalized.toUpperCase()] ?? 0;
    if (cg > pg) best.set(c.courseName, c);
  }
  return Array.from(best.values());
}

export function buildCompletionPaceModel(
  courses: PaceCourseInput[],
  f5: Pick<
    F5Result,
    | "applicable"
    | "completedTotal"
    | "completedEngMathSci"
    | "missingEngMathSci"
    | "requiredTotal"
    | "requiredEngMathSci"
    | "lockInDate"
    | "pastLock"
    | "daysToLock"
  > | null,
  period: PacePeriod,
  today: Date = new Date()
): PaceChartModel | null {
  if (!f5 || !f5.applicable) return null;

  const lockDate = f5.lockInDate ? new Date(f5.lockInDate) : null;
  const counted = countedCourses(courses, lockDate);

  const byTerm = new Map<string, PaceCourseInput[]>();
  for (const c of counted) {
    const end = new Date(c.termEndDate);
    const key = termKey(end, period);
    const list = byTerm.get(key) ?? [];
    list.push(c);
    byTerm.set(key, list);
  }

  const keys = Array.from(byTerm.keys()).sort();
  if (keys.length === 0 && f5.completedTotal === 0) {
    return {
      points: [],
      paceTotal: [],
      paceEms: null,
      lockLabel: lockDate
        ? lockDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        : null,
      lockKey: lockDate ? termKey(lockDate, period) : null,
      pastLock: f5.pastLock,
      behindPace: false,
      showEmsLine: f5.missingEngMathSci > 0,
      requiredTotal: f5.requiredTotal,
      requiredEms: f5.requiredEngMathSci,
    };
  }

  let cumTotal = 0;
  let cumEms = 0;
  const currentKey = termKey(today, period);
  const points: PaceTermPoint[] = keys.map((key) => {
    const termCourses = byTerm.get(key) ?? [];
    cumTotal += termCourses.length;
    cumEms += termCourses.filter(
      (c) => c.ncaaD1Category && EMS.has(c.ncaaD1Category)
    ).length;
    return {
      key,
      label: termLabel(key, period),
      cumulativeTotal: cumTotal,
      cumulativeEms: cumEms,
      isCurrent: key === currentKey,
    };
  });

  if (points.length > 0 && !points.some((p) => p.isCurrent)) {
    points[points.length - 1]!.isCurrent = true;
  }

  const lockKey = lockDate ? termKey(lockDate, period) : null;
  const firstKey = points[0]?.key ?? termKey(today, period);
  const lastKey = lockKey ?? points[points.length - 1]?.key ?? firstKey;

  const paceTotal = [
    { key: firstKey, targetTotal: points[0]?.cumulativeTotal ?? 0 },
    { key: lastKey, targetTotal: f5.requiredTotal },
  ];

  const showEmsLine = f5.missingEngMathSci > 0;
  const paceEms = showEmsLine
    ? [
        { key: firstKey, targetEms: points[0]?.cumulativeEms ?? 0 },
        { key: lastKey, targetEms: f5.requiredEngMathSci },
      ]
    : null;

  const latest = points[points.length - 1];
  const targetAtLatest =
    paceTotal.find((p) => p.key === latest?.key)?.targetTotal ??
    f5.requiredTotal;
  const behindPace =
    !f5.pastLock &&
    latest != null &&
    latest.cumulativeTotal < targetAtLatest - 0.25;

  return {
    points,
    paceTotal,
    paceEms,
    lockLabel: lockDate
      ? f5.pastLock
        ? `Locked ${lockDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
        : lockDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : null,
    lockKey,
    pastLock: f5.pastLock,
    behindPace,
    showEmsLine,
    requiredTotal: f5.requiredTotal,
    requiredEms: f5.requiredEngMathSci,
  };
}

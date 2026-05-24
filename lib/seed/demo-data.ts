/**
 * DEMO SEED — in-memory placeholder data (single fictional school).
 * Superseded for production by the District / HighSchool / CourseClassification
 * tables per D2. Retained for: (a) the 35-test F5 suite, (b) the v0.1 district
 * demo until Manteca + Tracy DB data is verified. Do not add new schools here.
 *
 * 12 student-athletes across Manteca Unified School District high schools (demo cohort).
 * Students TC1 (Marcus), TC2 (Aaliyah), TC3 (Jordan) match D1 Spec §14 exactly.
 * Remaining 9 students provide cohort distribution: GREEN / YELLOW / RED / LOCKED.
 *
 * All data is FICTIONAL. No real student PII.
 * Today reference: 2026-05-05 (demo date per Operation TTG 36-Hour Demo Plan)
 */

import { calcNcaa107Status, F5CourseRecord, F5SchoolCalendar, F5StudentInput } from "../calculations/f5";

export const DEMO_TODAY = new Date("2026-05-05");

// ─── Manteca Unified School District — shared demo calendar assumptions ─────

export const MUSD_CALENDAR: F5SchoolCalendar = {
  seniorFallTermStart: new Date("2026-08-17"),
  summerTermEndDate: new Date("2026-08-01"),
  maxCoresPerTerm: 4,
  maxEmsPerTerm: 2,
  calendarSourceUrl: "https://www.mantecausd.net/",
};

export const MUSD_CALENDAR_2025: F5SchoolCalendar = {
  seniorFallTermStart: new Date("2025-08-18"),
  summerTermEndDate: new Date("2025-08-01"),
  maxCoresPerTerm: 4,
  maxEmsPerTerm: 2,
  calendarSourceUrl: "https://www.mantecausd.net/",
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function c(
  id: string,
  courseName: string,
  grade: string,
  category: string,
  termEnd: string,
  agCat: string | null = null
): F5CourseRecord {
  return {
    id,
    courseName,
    gradeLetterNormalized: grade,
    termEndDate: new Date(termEnd),
    ncaaD1Category: category,
    ncaaApproved: true,
    agCategory: agCat,
    classificationUpdatedAt: new Date("2026-01-15"),
  };
}

// ─── TC1: Marcus Torres — YELLOW (8/10, 6/7 EMS, 104 days to lock) ───────────

export const MARCUS_STUDENT: F5StudentInput = {
  id: "stu_marcus_001",
  targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_manteca_high",
  highSchoolName: "Manteca High School",
  grade: 11,
};

export const MARCUS_COURSES: F5CourseRecord[] = [
  c("m1", "English 9",   "B", "eng",      "2024-06-10"),
  c("m2", "English 10",  "A", "eng",      "2025-06-10"),
  c("m3", "Algebra 1",   "B", "math",     "2024-06-10"),
  c("m4", "Geometry",    "B", "math",     "2025-06-10"),
  c("m5", "Biology",     "A", "sci",      "2024-06-10"),
  c("m6", "Chemistry",   "B", "sci",      "2025-06-10"),
  c("m7", "US History",  "B", "soc_sci",  "2025-06-10"),
  c("m8", "Spanish 1",   "C", "addl_any", "2025-06-10"),
  c("m9", "Algebra 2",   "IP","math",     "2026-06-15"), // IP — excluded AD-2
];

// ─── TC2: Aaliyah Washington — LOCKED (9/10, past 2025-08-18) ────────────────

export const AALIYAH_STUDENT: F5StudentInput = {
  id: "stu_aaliyah_002",
  targetDivision: "DI",
  enrollmentDateGrade9: new Date("2022-08-22"),
  highSchoolId: "hs_east_union_high",
  highSchoolName: "East Union High School",
  grade: 12,
};

const recentClassified = new Date("2026-08-01");
export const AALIYAH_COURSES: F5CourseRecord[] = [
  { ...c("a1","English 9","A","eng","2023-06-10"), classificationUpdatedAt: recentClassified },
  { ...c("a2","English 10","B","eng","2024-06-10"), classificationUpdatedAt: recentClassified },
  { ...c("a3","English 11","B","eng","2025-01-15"), classificationUpdatedAt: recentClassified },
  { ...c("a4","English 12","C","eng","2025-06-10"), classificationUpdatedAt: recentClassified },
  { ...c("a5","Algebra 1","B","math","2023-06-10"), classificationUpdatedAt: recentClassified },
  { ...c("a6","Geometry","B","math","2024-06-10"), classificationUpdatedAt: recentClassified },
  { ...c("a7","Algebra 2","A","math","2025-06-10"), classificationUpdatedAt: recentClassified },
  { ...c("a8","Biology","B","sci","2023-06-10"), classificationUpdatedAt: recentClassified },
  { ...c("a9","US History","B","soc_sci","2024-06-10"), classificationUpdatedAt: recentClassified },
  // Senior-fall Physics: term_end after lock — excluded by AD-2
  { ...c("a10","Physics","B","sci","2026-01-15"), classificationUpdatedAt: recentClassified },
];

// ─── TC3: Jordan Kim — YELLOW + AD-3 dual flag ───────────────────────────────

export const JORDAN_STUDENT: F5StudentInput = {
  id: "stu_jordan_003",
  targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_sierra_high",
  highSchoolName: "Sierra High School",
  grade: 11,
};

export const JORDAN_COURSES: F5CourseRecord[] = [
  c("j1","English 9","B","eng","2024-06-10"),
  c("j2","English 10","A","eng","2025-06-10"),
  c("j3","English 11","B","eng","2026-01-15"),
  c("j4","World Literature","C","eng","2025-01-15"),
  c("j5","Algebra 1","B","math","2024-06-10"),
  // Geometry: D grade, dual flag (NCAA counts, A-G fails)
  { id:"j6", courseName:"Geometry", gradeLetterNormalized:"D", termEndDate:new Date("2025-06-10"),
    ncaaD1Category:"math", ncaaApproved:true, agCategory:"c", classificationUpdatedAt:new Date("2026-01-15") },
  c("j7","Biology","A","sci","2024-06-10"),
  c("j8","Chemistry","B","sci","2025-06-10"),
  c("j9","US History","C","soc_sci","2025-06-10"),
];

// ─── 9 additional fictional students for cohort distribution ─────────────────

// Maya Chen — GREEN (10/10, 7/7 EMS, locked) — all complete
export const MAYA_STUDENT: F5StudentInput = {
  id: "stu_maya_004", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_manteca_high", highSchoolName: "Manteca High School", grade: 11,
};
export const MAYA_COURSES: F5CourseRecord[] = [
  c("my1","English 9","A","eng","2024-06-10"),
  c("my2","English 10","B","eng","2025-06-10"),
  c("my3","English 11","A","eng","2026-01-15"),
  c("my4","Algebra 1","A","math","2024-06-10"),
  c("my5","Geometry","B","math","2025-06-10"),
  c("my6","Algebra 2","A","math","2026-01-15"),
  c("my7","Biology","B","sci","2024-06-10"),
  c("my8","Chemistry","A","sci","2025-06-10"),
  c("my9","Physics","B","sci","2026-01-15"),
  c("my10","US History","B","soc_sci","2025-06-10"),
];

// DeShawn Peters — GREEN (10/10, 7/7 EMS)
export const DESHAWN_STUDENT: F5StudentInput = {
  id: "stu_deshawn_005", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_east_union_high", highSchoolName: "East Union High School", grade: 11,
};
export const DESHAWN_COURSES: F5CourseRecord[] = [
  c("ds1","English 9","B","eng","2024-06-10"),
  c("ds2","English 10","B","eng","2025-06-10"),
  c("ds3","English 11","C","eng","2026-01-15"),
  c("ds4","Algebra 1","B","math","2024-06-10"),
  c("ds5","Geometry","C","math","2025-06-10"),
  c("ds6","Algebra 2","B","math","2026-01-15"),
  c("ds7","Biology","B","sci","2024-06-10"),
  c("ds8","Chemistry","B","sci","2025-06-10"),
  c("ds9","Physics","C","sci","2026-01-15"),
  c("ds10","US History","B","soc_sci","2025-06-10"),
];

// Priya Patel — GREEN (10/10, 7/7 EMS)
export const PRIYA_STUDENT: F5StudentInput = {
  id: "stu_priya_006", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_sierra_high", highSchoolName: "Sierra High School", grade: 11,
};
export const PRIYA_COURSES: F5CourseRecord[] = [
  c("pr1","English 9","A","eng","2024-06-10"),
  c("pr2","English 10","A","eng","2025-06-10"),
  c("pr3","English 11","B","eng","2026-01-15"),
  c("pr4","Algebra 1","B","math","2024-06-10"),
  c("pr5","Geometry","B","math","2025-06-10"),
  c("pr6","Algebra 2","B","math","2026-01-15"),
  c("pr7","Biology","A","sci","2024-06-10"),
  c("pr8","Chemistry","B","sci","2025-06-10"),
  c("pr9","Earth Science","B","sci","2026-01-15"),
  c("pr10","World History","A","soc_sci","2025-06-10"),
];

// Isaiah Brooks — YELLOW (7/10, 5/7 EMS) — behind but has time
export const ISAIAH_STUDENT: F5StudentInput = {
  id: "stu_isaiah_007", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_weston_ranch_high", highSchoolName: "Weston Ranch High School", grade: 11,
};
export const ISAIAH_COURSES: F5CourseRecord[] = [
  c("is1","English 9","B","eng","2024-06-10"),
  c("is2","English 10","C","eng","2025-06-10"),
  c("is3","Algebra 1","B","math","2024-06-10"),
  c("is4","Geometry","C","math","2025-06-10"),
  c("is5","Biology","B","sci","2024-06-10"),
  c("is6","Chemistry","C","sci","2025-06-10"),
  c("is7","US History","B","soc_sci","2025-06-10"),
];

// Sofia Ramirez — YELLOW (6/10, 4/7 EMS) — needs math + sci
export const SOFIA_STUDENT: F5StudentInput = {
  id: "stu_sofia_008", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_weston_ranch_high", highSchoolName: "Weston Ranch High School", grade: 10,
};
export const SOFIA_COURSES: F5CourseRecord[] = [
  c("sf1","English 9","B","eng","2024-06-10"),
  c("sf2","English 10","B","eng","2025-06-10"),
  c("sf3","Algebra 1","C","math","2024-06-10"),
  c("sf4","Biology","B","sci","2024-06-10"),
  c("sf5","US History","B","soc_sci","2025-06-10"),
  c("sf6","Spanish 1","C","addl_any","2025-06-10"),
];

// Tyrone Jackson — YELLOW (8/10, 6/7 EMS) — similar to Marcus
export const TYRONE_STUDENT: F5StudentInput = {
  id: "stu_tyrone_009", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_sierra_high", highSchoolName: "Sierra High School", grade: 11,
};
export const TYRONE_COURSES: F5CourseRecord[] = [
  c("ty1","English 9","B","eng","2024-06-10"),
  c("ty2","English 10","B","eng","2025-06-10"),
  c("ty3","Algebra 1","B","math","2024-06-10"),
  c("ty4","Geometry","C","math","2025-06-10"),
  c("ty5","Biology","B","sci","2024-06-10"),
  c("ty6","Chemistry","C","sci","2025-06-10"),
  c("ty7","US History","C","soc_sci","2025-06-10"),
  c("ty8","Spanish 2","B","addl_any","2026-01-15"),
];

// Destiny Williams — RED (5/10, 3/7 EMS, only 2 terms left — can't recover 5 missing)
export const DESTINY_STUDENT: F5StudentInput = {
  id: "stu_destiny_010", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_weston_ranch_high", highSchoolName: "Weston Ranch High School", grade: 11,
};
export const DESTINY_COURSES: F5CourseRecord[] = [
  c("de1","English 9","C","eng","2024-06-10"),
  c("de2","Algebra 1","C","math","2024-06-10"),
  c("de3","Biology","C","sci","2024-06-10"),
  c("de4","US History","C","soc_sci","2025-06-10"),
  c("de5","Spanish 1","C","addl_any","2025-06-10"),
];

// Jamal Foster — YELLOW (7/10, 6/7 EMS)
export const JAMAL_STUDENT: F5StudentInput = {
  id: "stu_jamal_011", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_manteca_high", highSchoolName: "Manteca High School", grade: 11,
};
export const JAMAL_COURSES: F5CourseRecord[] = [
  c("jf1","English 9","B","eng","2024-06-10"),
  c("jf2","English 10","A","eng","2025-06-10"),
  c("jf3","Algebra 1","A","math","2024-06-10"),
  c("jf4","Geometry","B","math","2025-06-10"),
  c("jf5","Biology","A","sci","2024-06-10"),
  c("jf6","Chemistry","B","sci","2025-06-10"),
  c("jf7","US History","B","soc_sci","2025-06-10"),
];

// Brianna Scott — YELLOW (8/10, 7/7 EMS — EMS met, 2 non-EMS missing)
export const BRIANNA_STUDENT: F5StudentInput = {
  id: "stu_brianna_012", targetDivision: "DI",
  enrollmentDateGrade9: new Date("2023-08-21"),
  highSchoolId: "hs_east_union_high", highSchoolName: "East Union High School", grade: 11,
};
export const BRIANNA_COURSES: F5CourseRecord[] = [
  c("br1","English 9","A","eng","2024-06-10"),
  c("br2","English 10","B","eng","2025-06-10"),
  c("br3","English 11","B","eng","2026-01-15"),
  c("br4","Algebra 1","B","math","2024-06-10"),
  c("br5","Geometry","A","math","2025-06-10"),
  c("br6","Algebra 2","B","math","2026-01-15"),
  c("br7","Biology","A","sci","2024-06-10"),
  c("br8","US History","B","soc_sci","2025-06-10"),
];

// ─── Compute all F5 results ───────────────────────────────────────────────────

export interface DemoStudent {
  student: F5StudentInput;
  courses: F5CourseRecord[];
  calendar: F5SchoolCalendar;
  calendarYear: string;
}

export const ALL_DEMO_STUDENTS: DemoStudent[] = [
  { student: MARCUS_STUDENT,  courses: MARCUS_COURSES,  calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: AALIYAH_STUDENT, courses: AALIYAH_COURSES, calendar: MUSD_CALENDAR_2025, calendarYear: "2025" },
  { student: JORDAN_STUDENT,  courses: JORDAN_COURSES,  calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: MAYA_STUDENT,    courses: MAYA_COURSES,    calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: DESHAWN_STUDENT, courses: DESHAWN_COURSES, calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: PRIYA_STUDENT,   courses: PRIYA_COURSES,   calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: ISAIAH_STUDENT,  courses: ISAIAH_COURSES,  calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: SOFIA_STUDENT,   courses: SOFIA_COURSES,   calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: TYRONE_STUDENT,  courses: TYRONE_COURSES,  calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: DESTINY_STUDENT, courses: DESTINY_COURSES, calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: JAMAL_STUDENT,   courses: JAMAL_COURSES,   calendar: MUSD_CALENDAR, calendarYear: "2026" },
  { student: BRIANNA_STUDENT, courses: BRIANNA_COURSES, calendar: MUSD_CALENDAR, calendarYear: "2026" },
];

// Student display names map
export const STUDENT_NAMES: Record<string, { firstName: string; lastName: string; sport: string }> = {
  stu_marcus_001:  { firstName: "Marcus",  lastName: "Torres",    sport: "Football" },
  stu_aaliyah_002: { firstName: "Aaliyah", lastName: "Washington",sport: "Track & Field" },
  stu_jordan_003:  { firstName: "Jordan",  lastName: "Kim",       sport: "Basketball" },
  stu_maya_004:    { firstName: "Maya",    lastName: "Chen",      sport: "Soccer" },
  stu_deshawn_005: { firstName: "DeShawn", lastName: "Peters",    sport: "Baseball" },
  stu_priya_006:   { firstName: "Priya",   lastName: "Patel",     sport: "Swimming" },
  stu_isaiah_007:  { firstName: "Isaiah",  lastName: "Brooks",    sport: "Football" },
  stu_sofia_008:   { firstName: "Sofia",   lastName: "Ramirez",   sport: "Volleyball" },
  stu_tyrone_009:  { firstName: "Tyrone",  lastName: "Jackson",   sport: "Basketball" },
  stu_destiny_010: { firstName: "Destiny", lastName: "Williams",  sport: "Track & Field" },
  stu_jamal_011:   { firstName: "Jamal",   lastName: "Foster",    sport: "Football" },
  stu_brianna_012: { firstName: "Brianna", lastName: "Scott",     sport: "Soccer" },
};

/**
 * Compute all F5 results for the demo cohort.
 * Returns pre-computed results — NOT computed on the client.
 */
export function computeAllDemoResults() {
  return ALL_DEMO_STUDENTS.map(({ student, courses, calendar }) => {
    const result = calcNcaa107Status(student, courses, calendar, DEMO_TODAY);
    const names = STUDENT_NAMES[student.id];
    return {
      studentId: student.id,
      firstName: names.firstName,
      lastName: names.lastName,
      sport: names.sport,
      grade: student.grade,
      highSchoolId: student.highSchoolId,
      highSchoolName: student.highSchoolName,
      targetDivision: student.targetDivision,
      courses,
      f5: result,
    };
  });
}

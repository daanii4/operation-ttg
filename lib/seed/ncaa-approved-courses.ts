export type NcaaApprovedCourseCategory =
  | "English"
  | "Mathematics"
  | "Natural/Physical Science"
  | "Social Science"
  | "Additional Core Electives";

export type NcaaApprovedCourse = {
  courseName: string;
  ncaaCategory: string;
  category: NcaaApprovedCourseCategory;
  countsTowardTenSeven: boolean;
  honorsEligible: boolean;
};

export type NcaaSchoolApprovedCourseSet = {
  highSchoolId: string;
  schoolName: string;
  districtName: string;
  /** Demo portal search helper — verify against eligibilitycenter.org before production. */
  ceebCode: string;
  schoolCleared: boolean;
  lastVerifiedDate: string;
  sourceUrl: string;
  courses: NcaaApprovedCourse[];
};

const NCAA_HS_PORTAL_SEARCH_URL =
  "https://web3.ncaa.org/hsportal/exec/hsAction?hsActionSubmit=searchHighSchool";

/**
 * Synthetic Manteca Unified School District catalog for demo cross-reference.
 * Course titles align with demo transcript rows in `lib/seed/demo-data.ts`.
 */
const DEMO_MUSD_SHARED_CORE: NcaaApprovedCourse[] = [
  {
    courseName: "English 9",
    ncaaCategory: "eng",
    category: "English",
    countsTowardTenSeven: true,
    honorsEligible: false,
  },
  {
    courseName: "English 10",
    ncaaCategory: "eng",
    category: "English",
    countsTowardTenSeven: true,
    honorsEligible: false,
  },
  {
    courseName: "English 11",
    ncaaCategory: "eng",
    category: "English",
    countsTowardTenSeven: true,
    honorsEligible: true,
  },
  {
    courseName: "English 12",
    ncaaCategory: "eng",
    category: "English",
    countsTowardTenSeven: true,
    honorsEligible: false,
  },
  {
    courseName: "Algebra 1",
    ncaaCategory: "math",
    category: "Mathematics",
    countsTowardTenSeven: true,
    honorsEligible: false,
  },
  {
    courseName: "Geometry",
    ncaaCategory: "math",
    category: "Mathematics",
    countsTowardTenSeven: true,
    honorsEligible: false,
  },
  {
    courseName: "Algebra 2",
    ncaaCategory: "math",
    category: "Mathematics",
    countsTowardTenSeven: true,
    honorsEligible: true,
  },
  {
    courseName: "Biology",
    ncaaCategory: "sci",
    category: "Natural/Physical Science",
    countsTowardTenSeven: true,
    honorsEligible: false,
  },
  {
    courseName: "Chemistry",
    ncaaCategory: "sci",
    category: "Natural/Physical Science",
    countsTowardTenSeven: true,
    honorsEligible: true,
  },
  {
    courseName: "Physics",
    ncaaCategory: "sci",
    category: "Natural/Physical Science",
    countsTowardTenSeven: false,
    honorsEligible: true,
  },
  {
    courseName: "Earth Science",
    ncaaCategory: "sci",
    category: "Natural/Physical Science",
    countsTowardTenSeven: false,
    honorsEligible: false,
  },
  {
    courseName: "US History",
    ncaaCategory: "soc_sci",
    category: "Social Science",
    countsTowardTenSeven: true,
    honorsEligible: false,
  },
  {
    courseName: "World History",
    ncaaCategory: "soc_sci",
    category: "Social Science",
    countsTowardTenSeven: true,
    honorsEligible: false,
  },
  {
    courseName: "Spanish 1",
    ncaaCategory: "addl_any",
    category: "Additional Core Electives",
    countsTowardTenSeven: false,
    honorsEligible: false,
  },
  {
    courseName: "Spanish 2",
    ncaaCategory: "addl_any",
    category: "Additional Core Electives",
    countsTowardTenSeven: false,
    honorsEligible: false,
  },
  {
    courseName: "World Literature",
    ncaaCategory: "addl_any",
    category: "Additional Core Electives",
    countsTowardTenSeven: false,
    honorsEligible: true,
  },
];

function musdHighSchool(params: {
  highSchoolId: string;
  schoolName: string;
  ceebCode: string;
}): NcaaSchoolApprovedCourseSet {
  return {
    highSchoolId: params.highSchoolId,
    schoolName: params.schoolName,
    districtName: "Manteca Unified School District",
    ceebCode: params.ceebCode,
    schoolCleared: true,
    lastVerifiedDate: "2026-04-21",
    sourceUrl: NCAA_HS_PORTAL_SEARCH_URL,
    courses: DEMO_MUSD_SHARED_CORE,
  };
}

export const NCAA_APPROVED_COURSES_BY_SCHOOL: NcaaSchoolApprovedCourseSet[] = [
  musdHighSchool({
    highSchoolId: "hs_manteca_high",
    schoolName: "Manteca High School",
    ceebCode: "051858",
  }),
  musdHighSchool({
    highSchoolId: "hs_east_union_high",
    schoolName: "East Union High School",
    ceebCode: "050617",
  }),
  musdHighSchool({
    highSchoolId: "hs_sierra_high",
    schoolName: "Sierra High School",
    ceebCode: "051407",
  }),
  musdHighSchool({
    highSchoolId: "hs_weston_ranch_high",
    schoolName: "Weston Ranch High School",
    ceebCode: "051919",
  }),
];

export function getNcaaSchoolApprovedCourses(
  highSchoolId: string
): NcaaSchoolApprovedCourseSet | null {
  return (
    NCAA_APPROVED_COURSES_BY_SCHOOL.find((row) => row.highSchoolId === highSchoolId) ??
    null
  );
}

export function buildNcaaPortalDeepLink(ceebCode: string): string {
  const url = new URL(NCAA_HS_PORTAL_SEARCH_URL);
  url.searchParams.set("code", ceebCode);
  return url.toString();
}

export function normalizeCourseName(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

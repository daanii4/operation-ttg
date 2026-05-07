import type { CohortStudentRow } from "@/app/api/cohort/route";
import type { HolisticStudentRisk } from "@/lib/calculations/holistic-rollup";

export type DeadlineCategory =
  | "school"
  | "district_intervention"
  | "college_state";

export type DeadlineContext = {
  student: CohortStudentRow;
  holistic: HolisticStudentRisk;
};

export type DeadlineRegistryEntry = {
  id: string;
  name: string;
  category: DeadlineCategory;
  /** ISO date (YYYY-MM-DD) OR annual marker ANNUAL-MM-DD */
  date: string;
  label: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  appliesTo: (ctx: DeadlineContext) => boolean;
};

export const MUSD_COHORT_DEADLINES: DeadlineRegistryEntry[] = [
  {
    id: "summer_school_credit_recovery_close",
    name: "Summer School Credit Recovery Application Close",
    category: "district_intervention",
    date: "2026-05-30",
    label: "DISTRICT INTERVENTION",
    description:
      "Last day to register students for Manteca USD summer credit recovery before senior-year lock-in.",
    sourceLabel: "Manteca Unified District Calendar",
    sourceUrl: "https://www.mantecausd.net/",
    appliesTo: ({ student, holistic }) =>
      holistic.agStatus === "RED" ||
      student.agDualFlagCount > 0 ||
      student.missingTotal > 0,
  },
  {
    id: "spring_grade_close",
    name: "Spring Semester Grade Close",
    category: "school",
    date: "2026-06-05",
    label: "SCHOOL",
    description:
      "Final spring grade posting window before summer recovery decisions.",
    sourceLabel: "Manteca Unified District Calendar",
    sourceUrl: "https://www.mantecausd.net/",
    appliesTo: ({ holistic }) =>
      holistic.gpaTrajectory === "declining" || holistic.agStatus !== "GREEN",
  },
  {
    id: "retake_grade_verification",
    name: "Retake Grade Verification",
    category: "district_intervention",
    date: "2026-06-15",
    label: "DISTRICT INTERVENTION",
    description:
      "Registrar verification deadline for retaken courses and credit recovery plans.",
    sourceLabel: "Manteca Unified District Calendar",
    sourceUrl: "https://www.mantecausd.net/",
    appliesTo: ({ student, holistic }) =>
      holistic.agStatus === "RED" || student.agDualFlagCount > 0,
  },
  {
    id: "summer_term_end",
    name: "Summer Term Ends",
    category: "school",
    date: "2026-08-01",
    label: "SCHOOL",
    description:
      "Last recoverable term ending before the NCAA 10/7 lock-in date.",
    sourceLabel: "Manteca Unified District Calendar",
    sourceUrl: "https://www.mantecausd.net/",
    appliesTo: ({ student }) => student.riskBand !== "GREEN",
  },
  {
    id: "ncaa_107_lock",
    name: "NCAA 10/7 Lock-In Date",
    category: "college_state",
    date: "2026-08-17",
    label: "NCAA",
    description:
      "First day of senior fall semester; NCAA D1 10/7 core-course count locks.",
    sourceLabel: "NCAA Bylaw 14.3",
    sourceUrl:
      "https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/",
    appliesTo: ({ student }) => student.riskBand !== "GREEN",
  },
  {
    id: "uc_csu_priority_open",
    name: "UC/CSU Priority Application Filing Opens",
    category: "college_state",
    date: "2026-10-01",
    label: "COLLEGE / STATE",
    description:
      "Opening date for the UC/CSU priority application filing window.",
    sourceLabel: "University of California Admissions",
    sourceUrl:
      "https://admission.universityofcalifornia.edu/",
    appliesTo: ({ holistic }) => holistic.agStatus !== "RED",
  },
  {
    id: "fafsa_opens_annual",
    name: "FAFSA Opens (Annual)",
    category: "college_state",
    date: "ANNUAL-10-01",
    label: "FEDERAL / STATE",
    description:
      "FAFSA application opens for the upcoming academic year. File immediately — California Cal Grant is first-come, first-served and state funds run out before the federal June 30 deadline.",
    sourceLabel: "U.S. Department of Education (Federal Student Aid)",
    sourceUrl: "https://studentaid.gov/articles/3-fafsa-deadlines/",
    appliesTo: ({ student }) => student.grade === 11 || student.grade === 12,
  },
  {
    id: "cal_grant_priority_deadline_annual",
    name: "California Cal Grant Priority Deadline (Annual)",
    category: "college_state",
    date: "ANNUAL-03-02",
    label: "CALIFORNIA STATE",
    description:
      "Cal Grant requires FAFSA submission and a school-certified GPA form submitted to CSAC by this date. Missing this deadline permanently eliminates Cal Grant eligibility for that year.",
    sourceLabel: "California Student Aid Commission (CSAC)",
    sourceUrl: "https://www.csac.ca.gov/post/important-dates-and-deadlines",
    appliesTo: ({ student }) => student.grade === 12,
  },
  {
    id: "federal_fafsa_final_deadline_annual",
    name: "Federal FAFSA Final Deadline",
    category: "college_state",
    date: "ANNUAL-06-30",
    label: "FEDERAL",
    description:
      "Last day to submit FAFSA for this academic year. This is the absolute backstop — state grant funds and institutional aid will already be depleted by this point.",
    sourceLabel: "U.S. Department of Education (Federal Student Aid)",
    sourceUrl: "https://studentaid.gov/articles/3-fafsa-deadlines/",
    appliesTo: ({ student }) => student.grade === 12,
  },
];

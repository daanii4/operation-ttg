import { calcNcaaD1Gpa } from "../f4";
import { makeClassifiedCourse, BASE_STUDENT } from "./test-helpers";

const enrollment = new Date("2023-08-21");

describe("F4 — NCAA D1 GPA", () => {
  it("TC-F4-best16 — excludes courses beyond best 16", () => {
    const courses = Array.from({ length: 20 }, (_, i) =>
      makeClassifiedCourse({
        id: `c${i}`,
        courseName: `Core ${i}`,
        ncaaD1Category: "eng",
        ncaaApproved: true,
        gradeLetterNormalized: "A",
        termEndDate: new Date(`2025-0${(i % 6) + 1}-15`),
      })
    );
    const result = calcNcaaD1Gpa(
      { ...BASE_STUDENT, enrollmentDateGrade9: enrollment },
      courses
    );
    expect(result.coresUsedInCalc).toBe(16);
    expect(result.coresExcludedBeyond16.length).toBe(4);
  });

  it("TC-F4-redshirt — 2.0–2.299 is ACADEMIC_REDSHIRT", () => {
    const courses = Array.from({ length: 16 }, (_, i) =>
      makeClassifiedCourse({
        id: `c${i}`,
        courseName: `Core ${i}`,
        ncaaD1Category: "eng",
        ncaaApproved: true,
        gradeLetterNormalized: "C",
        termEndDate: new Date("2025-06-15"),
      })
    );
    const result = calcNcaaD1Gpa(
      { ...BASE_STUDENT, enrollmentDateGrade9: enrollment },
      courses
    );
    expect(result.coreGpaWeighted).toBeGreaterThanOrEqual(2.0);
    expect(result.coreGpaWeighted).toBeLessThan(2.3);
    expect(result.qualifierStatus).toBe("ACADEMIC_REDSHIRT");
  });

  it("Marcus — FULL_QUALIFIER transcript-derived core GPA", () => {
    const { f5CoursesToClassified, f5StudentToStudentInput } = require("@/lib/eligibility/demo-classified-courses");
    const { MARCUS_STUDENT, MARCUS_COURSES } = require("@/lib/seed/demo-data");
    const result = calcNcaaD1Gpa(
      f5StudentToStudentInput(MARCUS_STUDENT),
      f5CoursesToClassified(MARCUS_COURSES)
    );
    expect(result.qualifierStatus).toBe("FULL_QUALIFIER");
    expect(result.coreGpaWeighted).toBeGreaterThanOrEqual(2.8);
  });
});

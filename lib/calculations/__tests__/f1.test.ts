import { calcAgCompletion } from "../f1";
import { makeClassifiedCourse, BASE_STUDENT } from "./test-helpers";

describe("F1 — A-G completion", () => {
  it("TC4 — flags geometry rule when math years met without geometry", () => {
    const courses = [
      makeClassifiedCourse({
        id: "1",
        courseName: "Algebra 1",
        agCategory: "c",
        agApproved: true,
        gradeLetterNormalized: "B",
        countsGeometryForAg: false,
        termLength: "year",
      }),
      makeClassifiedCourse({
        id: "2",
        courseName: "Algebra 2",
        agCategory: "c",
        agApproved: true,
        gradeLetterNormalized: "B",
        countsGeometryForAg: false,
        termLength: "year",
      }),
      makeClassifiedCourse({
        id: "3",
        courseName: "Precalculus",
        agCategory: "c",
        agApproved: true,
        gradeLetterNormalized: "A",
        countsGeometryForAg: false,
        termLength: "year",
      }),
    ];
    const result = calcAgCompletion(BASE_STUDENT, courses);
    expect(result.ruleViolations.some((v) => v.rule === "geometry_required")).toBe(true);
    expect(result.perCategory.c.complete).toBe(false);
  });

  it("TC-F1-pre9th — pre-9th only counts for c and e", () => {
    const enrollment = new Date("2023-08-21");
    const pre9thEnd = new Date("2024-06-01");
    const courses = [
      makeClassifiedCourse({
        id: "1",
        courseName: "Algebra 1",
        agCategory: "c",
        agApproved: true,
        preNinthGradeEligible: true,
        termEndDate: pre9thEnd,
        gradeLetterNormalized: "A",
        termLength: "year",
        countsGeometryForAg: true,
      }),
      makeClassifiedCourse({
        id: "2",
        courseName: "US History",
        agCategory: "a",
        agApproved: true,
        preNinthGradeEligible: false,
        termEndDate: pre9thEnd,
        gradeLetterNormalized: "A",
        termLength: "year",
      }),
    ];
    const result = calcAgCompletion(
      { ...BASE_STUDENT, enrollmentDateGrade9: enrollment },
      courses
    );
    expect(result.perCategory.c.completedYears).toBeGreaterThan(0);
    expect(result.perCategory.a.completedYears).toBe(0);
  });

  it("TC-F1-same-lang — same language rule when years split", () => {
    const courses = [
      makeClassifiedCourse({
        id: "1",
        courseName: "Spanish 1",
        agCategory: "e",
        agApproved: true,
        agLanguageCode: "es",
        gradeLetterNormalized: "B",
        termLength: "year",
      }),
      makeClassifiedCourse({
        id: "2",
        courseName: "French 1",
        agCategory: "e",
        agApproved: true,
        agLanguageCode: "fr",
        gradeLetterNormalized: "B",
        termLength: "year",
      }),
    ];
    const result = calcAgCompletion(BASE_STUDENT, courses);
    expect(
      result.ruleViolations.some((v) => v.rule === "same_language_2yrs_required")
    ).toBe(true);
  });

  it("Marcus — A-G not fully complete on partial transcript", () => {
    const { f5CoursesToClassified, f5StudentToStudentInput } = require("@/lib/eligibility/demo-classified-courses");
    const { MARCUS_STUDENT, MARCUS_COURSES } = require("@/lib/seed/demo-data");
    const result = calcAgCompletion(
      f5StudentToStudentInput(MARCUS_STUDENT),
      f5CoursesToClassified(MARCUS_COURSES)
    );
    expect(result.fullyComplete).toBe(false);
  });

  it("Jordan — one credit recovery for D-grade geometry", () => {
    const { f5CoursesToClassified, f5StudentToStudentInput } = require("@/lib/eligibility/demo-classified-courses");
    const { JORDAN_STUDENT, JORDAN_COURSES } = require("@/lib/seed/demo-data");
    const result = calcAgCompletion(
      f5StudentToStudentInput(JORDAN_STUDENT),
      f5CoursesToClassified(JORDAN_COURSES)
    );
    expect(result.creditRecoveryCandidates).toHaveLength(1);
    expect(result.creditRecoveryCandidates[0].courseName).toMatch(/geometry/i);
  });
});

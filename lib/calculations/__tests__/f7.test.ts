import { calcNcaaD2Gpa } from "../f7";
import { makeClassifiedCourse, BASE_STUDENT } from "./test-helpers";

describe("F7 — NCAA D2 GPA", () => {
  it("TC-F7-partial-qualifier — GPA 2.15 is PARTIAL_QUALIFIER", () => {
    const student = { ...BASE_STUDENT, targetDivision: "DII" };
    const enrollment = new Date("2023-08-21");
    const courses = Array.from({ length: 16 }, (_, i) =>
      makeClassifiedCourse({
        id: `c${i}`,
        courseName: `Core ${i}`,
        ncaaD2Category: "eng",
        ncaaD1Category: "eng",
        ncaaApproved: true,
        gradeLetterNormalized: "C",
        termEndDate: new Date("2025-06-15"),
      })
    );
    const result = calcNcaaD2Gpa(
      { ...student, enrollmentDateGrade9: enrollment },
      courses
    );
    expect(result.coreGpaWeighted).toBeCloseTo(2.0, 1);
    expect(result.qualifierStatus).toBe("PARTIAL_QUALIFIER");
  });
});

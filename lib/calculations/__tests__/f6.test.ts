import { calcNcaaD2Completion } from "../f6";
import { makeClassifiedCourse, BASE_STUDENT } from "./test-helpers";

describe("F6 — NCAA D2 completion", () => {
  it("TC-F6-d2-distribution — no geometry rule", () => {
    const student = { ...BASE_STUDENT, targetDivision: "DII" };
    const courses = [
      makeClassifiedCourse({
        id: "1",
        courseName: "Algebra 1",
        ncaaD2Category: "math",
        ncaaD1Category: "math",
        ncaaApproved: true,
        countsGeometryForNcaa: false,
        termLength: "year",
      }),
      makeClassifiedCourse({
        id: "2",
        courseName: "Algebra 2",
        ncaaD2Category: "math",
        ncaaD1Category: "math",
        ncaaApproved: true,
        countsGeometryForNcaa: false,
        termLength: "year",
      }),
    ];
    const result = calcNcaaD2Completion(student, courses);
    expect(result.ruleViolations).toHaveLength(0);
    expect(result.applicable).toBe(true);
  });
});

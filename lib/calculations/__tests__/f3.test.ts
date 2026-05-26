import { calcNcaaD1Completion } from "../f3";
import { makeClassifiedCourse, BASE_STUDENT } from "./test-helpers";

describe("F3 — NCAA D1 completion", () => {
  it("TC-F3-surplus — EMS overflow flows to addl_ems then addl_any", () => {
    const mk = (id: string, cat: string, years: number) => {
      const rows = [];
      for (let i = 0; i < years * 2; i++) {
        rows.push(
          makeClassifiedCourse({
            id: `${id}-${i}`,
            courseName: `${cat} ${i}`,
            ncaaD1Category: cat,
            ncaaD2Category: cat,
            ncaaApproved: true,
            gradeLetterNormalized: "A",
            termLength: "semester",
            termEndDate: new Date(`2024-0${(i % 6) + 1}-15`),
          })
        );
      }
      return rows;
    };
    const courses = [
      ...mk("e", "eng", 5),
      ...mk("m", "math", 4),
      ...mk("s", "sci", 3),
    ];
    const result = calcNcaaD1Completion(BASE_STUDENT, courses);
    expect(result.perCategory.addl_ems.completedYears).toBe(1);
    expect(result.totalCompleted).toBeLessThanOrEqual(16);
  });

  it("TC-F3-geometry — geometry required when math met", () => {
    const courses = [
      makeClassifiedCourse({
        id: "1",
        courseName: "Algebra 1",
        ncaaD1Category: "math",
        ncaaApproved: true,
        countsGeometryForNcaa: false,
        termLength: "year",
      }),
      makeClassifiedCourse({
        id: "2",
        courseName: "Algebra 2",
        ncaaD1Category: "math",
        ncaaApproved: true,
        countsGeometryForNcaa: false,
        termLength: "year",
      }),
      makeClassifiedCourse({
        id: "3",
        courseName: "Precalculus",
        ncaaD1Category: "math",
        ncaaApproved: true,
        countsGeometryForNcaa: false,
        termLength: "year",
      }),
    ];
    const result = calcNcaaD1Completion(BASE_STUDENT, courses);
    expect(result.geometrySatisfied).toBe(false);
    expect(result.ruleViolations.some((v) => v.rule === "geometry_required_for_d1")).toBe(
      true
    );
  });

  it("Aaliyah — not fully complete on 16-core", () => {
    const { f5CoursesToClassified, f5StudentToStudentInput } = require("@/lib/eligibility/demo-classified-courses");
    const { AALIYAH_STUDENT, AALIYAH_COURSES } = require("@/lib/seed/demo-data");
    const result = calcNcaaD1Completion(
      f5StudentToStudentInput(AALIYAH_STUDENT),
      f5CoursesToClassified(AALIYAH_COURSES)
    );
    expect(result.fullyComplete).toBe(false);
  });
});

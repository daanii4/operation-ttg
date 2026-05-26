import { calcAgGpa } from "../f2";
import { makeClassifiedCourse, BASE_STUDENT } from "./test-helpers";

const enrollment = new Date("2023-08-21");

describe("F2 — A-G GPA", () => {
  it("TC5 — honors cap at 8 semesters", () => {
    const courses = Array.from({ length: 10 }, (_, i) =>
      makeClassifiedCourse({
        id: `h${i}`,
        courseName: `Honors Course ${i}`,
        agCategory: "b",
        agApproved: true,
        ucApprovedHonors: true,
        gradeLetterNormalized: "A",
        termLength: "year",
        termEndDate: new Date(`2025-0${(i % 6) + 1}-15`),
      })
    );
    const result = calcAgGpa({ ...BASE_STUDENT, enrollmentDateGrade9: enrollment }, courses);
    expect(result.honorsSemestersUsed).toBeLessThanOrEqual(8);
    expect(result.hoursCoursesExcludedByCap.length).toBeGreaterThan(0);
  });

  it("TC6 — R1 no honors bonus on D", () => {
    const courses = [
      makeClassifiedCourse({
        id: "1",
        courseName: "Honors English",
        agCategory: "b",
        agApproved: true,
        ucApprovedHonors: true,
        gradeLetterNormalized: "D",
        termEndDate: new Date("2025-06-15"),
      }),
    ];
    const result = calcAgGpa({ ...BASE_STUDENT, enrollmentDateGrade9: enrollment }, courses);
    expect(result.honorsBonusPoints).toBe(0);
  });

  it("TC-F2-window — excludes 9th-grade year from GPA window", () => {
    const grade9Course = makeClassifiedCourse({
      id: "g9",
      courseName: "English 9",
      agCategory: "b",
      agApproved: true,
      gradeLetterNormalized: "A",
      termEndDate: new Date("2024-06-10"),
    });
    const result = calcAgGpa({ ...BASE_STUDENT, enrollmentDateGrade9: enrollment }, [
      grade9Course,
    ]);
    expect(result.totalCoursesInCalc).toBe(0);
  });
});

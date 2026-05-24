import { classifyCourses } from "@/lib/calculations/classify-courses";

describe("classifyCourses", () => {
  const classifications = [
    {
      courseNameNormalized: "geometry",
      ncaaD1Category: "math",
      ncaaApproved: true,
      agCategory: "c",
      lastVerifiedDate: new Date("2026-01-01"),
    },
  ];

  it("matches catalog via alias map", () => {
    const result = classifyCourses(
      [
        {
          id: "1",
          courseName: "Geom",
          gradeLetterNormalized: "B",
          termEndDate: new Date("2025-06-01"),
        },
      ],
      classifications,
      { geom: "geometry" }
    );
    expect(result[0].ncaaD1Category).toBe("math");
    expect(result[0].ncaaApproved).toBe(true);
  });

  it("returns unclassified when no catalog match", () => {
    const result = classifyCourses(
      [
        {
          id: "2",
          courseName: "Unknown Elective",
          gradeLetterNormalized: "A",
          termEndDate: new Date("2025-06-01"),
        },
      ],
      classifications,
      null
    );
    expect(result[0].ncaaD1Category).toBeNull();
    expect(result[0].ncaaApproved).toBe(false);
  });
});

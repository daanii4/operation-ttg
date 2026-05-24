import {
  parseAgCourseTable,
  parseNcaaCourseTable,
} from "@/lib/ingestion/parse-course-table";

const NCAA_PASTE = `Course Name\tSubject Area\tStatus
English 9\tEnglish\tApproved
Geometry\tMathematics\tApproved
Biology\tNatural/Physical Science\tApproved
Study Hall\tOther\tOn Hold
not enough columns`;

const UC_PASTE = `Course Title\tA-G Subject\tStatus
English 9\tEnglish\tActive
Biology\tLaboratory Science\tActive
bad row only`;

describe("parseNcaaCourseTable", () => {
  it("parses expected NCAA rows with category mapping", () => {
    const { courses, skipped } = parseNcaaCourseTable(NCAA_PASTE);
    expect(courses).toHaveLength(4);
    expect(courses[0].ncaaD1Category).toBe("eng");
    expect(courses[1].ncaaD1Category).toBe("math");
    expect(courses[2].ncaaD1Category).toBe("sci");
    expect(courses.find((c) => c.courseNameDisplay === "Study Hall")?.approved).toBe(false);
    expect(skipped.length).toBeGreaterThanOrEqual(1);
  });
});

describe("parseAgCourseTable", () => {
  it("parses UC rows and collects malformed lines", () => {
    const { courses, skipped } = parseAgCourseTable(UC_PASTE);
    expect(courses).toHaveLength(2);
    expect(courses[0].agCategory).toBe("b");
    expect(courses[1].agCategory).toBe("d");
    expect(courses[1].agCategory === "d").toBe(true);
    expect(skipped.length).toBeGreaterThanOrEqual(1);
  });
});

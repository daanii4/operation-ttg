import { normalizeCourseName, resolveCourseName } from "@/lib/utils/course-normalize";

describe("normalizeCourseName", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeCourseName("  English   Lit.  ")).toBe("english lit");
  });

  it("normalizes ampersand to and", () => {
    expect(normalizeCourseName("Government & Economics")).toBe("government and economics");
  });
});

describe("resolveCourseName", () => {
  it("honors alias map", () => {
    const aliases = { bio: "biology" };
    expect(resolveCourseName("Bio", aliases)).toBe("biology");
  });

  it("returns base when no alias", () => {
    expect(resolveCourseName("Chemistry", null)).toBe("chemistry");
  });
});

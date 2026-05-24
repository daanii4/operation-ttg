import { scrapeNcaaCourseTable } from "@/lib/ingestion/playwright-ncaa";
import { scrapeUcAgCourseTable } from "@/lib/ingestion/playwright-ucag";

describe("D2 automated ingestion stubs", () => {
  const blocked = "D2 automated ingestion is disabled pending Agent 6 ToS review — D2 §10";

  it("NCAA stub throws when disabled", async () => {
    await expect(scrapeNcaaCourseTable("123456")).rejects.toThrow(blocked);
  });

  it("UC A-G stub throws when disabled", async () => {
    await expect(scrapeUcAgCourseTable("inst-1")).rejects.toThrow(blocked);
  });
});

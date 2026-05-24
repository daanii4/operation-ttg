/**
 * D2 §10 — automated NCAA portal fetch (disabled pending Agent 6 ToS review).
 * When enabled, fetches HTML and passes it to parseNcaaCourseTable().
 */
import { parseNcaaCourseTable } from "@/lib/ingestion/parse-course-table";

const BLOCKED =
  "D2 automated ingestion is disabled pending Agent 6 ToS review — D2 §10";

function assertAutomatedIngestionEnabled(): void {
  if (process.env.D2_AUTOMATED_INGESTION_ENABLED !== "true") {
    throw new Error(BLOCKED);
  }
}

export async function scrapeNcaaCourseTable(_ceebCode: string, _html?: string) {
  assertAutomatedIngestionEnabled();
  if (!_html) throw new Error(BLOCKED);
  return parseNcaaCourseTable(_html);
}

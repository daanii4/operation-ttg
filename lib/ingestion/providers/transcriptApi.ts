/**
 * Sprint 7 / Workstream A-3 — TranscriptAPI provider stub.
 *
 * Status: STUB — awaiting MCP-2 partnership agreement.
 * Do not replace `generateSyntheticTranscriptResponse` with a real fetch
 * until legal review is complete. Real endpoint will live at
 * `process.env.TRANSCRIPT_API_ENDPOINT`.
 *
 * The shape returned here is the Sprint 7 contract that the rest of the
 * pipeline depends on. When the live API is wired, the real provider
 * function replaces only the body of fetchStudentTranscript() — the type
 * stays stable.
 */

import { assertDataFeedEnabled } from "../guards";

export type ProviderId = "transcript_api";

export interface TranscriptApiCourse {
  course_name: string;
  grade_letter: "A" | "B" | "C" | "D" | "F" | "IP";
  term: "fall" | "spring" | "summer" | null;
  academic_year: string; // YYYY-YY
  term_length: "semester" | "quarter" | "trimester" | "year";
  /** True when a registrar signature has been verified end-to-end. */
  verified: boolean;
}

export interface TranscriptApiResponse {
  student_id: string;
  ceeb_code: string;
  /**
   * Always `true` for the stub. The flag is part of the contract: real
   * provider responses set this `false` so downstream consumers can tell
   * synthetic stub data apart from live data even if logging is lost.
   */
  is_synthetic: boolean;
  courses: TranscriptApiCourse[];
}

export async function fetchStudentTranscript(
  studentId: string,
  ceebCode: string
): Promise<TranscriptApiResponse> {
  assertDataFeedEnabled();

  if (!process.env.TRANSCRIPT_API_KEY) {
    throw new Error(
      "TRANSCRIPT_API_KEY not set — Class A ingestion unavailable"
    );
  }

  // STUB: returns synthetic data until the real provider is wired (MCP-2).
  // When wiring the real fetch, replace ONLY the body below; keep the
  // synthetic helper untouched so tests continue to exercise the
  // dedupe / encryption code paths.
  return generateSyntheticTranscriptResponse(studentId, ceebCode);
}

/**
 * Exported so the runner can call it directly during local testing without
 * juggling env vars. The is_synthetic flag is always true here — never
 * strip it on the consumer side.
 */
export function generateSyntheticTranscriptResponse(
  studentId: string,
  ceebCode: string
): TranscriptApiResponse {
  return {
    student_id: studentId,
    ceeb_code: ceebCode,
    is_synthetic: true,
    courses: [
      {
        course_name: "English 11 (SYNTHETIC)",
        grade_letter: "B",
        term: "fall",
        academic_year: "2024-25",
        term_length: "semester",
        verified: false,
      },
      {
        course_name: "Algebra 2 (SYNTHETIC)",
        grade_letter: "B",
        term: "spring",
        academic_year: "2024-25",
        term_length: "semester",
        verified: false,
      },
    ],
  };
}

/**
 * Sprint 6 / Workstream B — shared OCR types.
 *
 * These shapes are the contract between the upload handler, the OCR
 * processor, and the review UI. Keeping them in one file means the API
 * route handlers and the React components import from the same source.
 */

export type GradeLetter = "A" | "B" | "C" | "D" | "F" | "IP";

export type Term = "fall" | "spring" | "summer";

export type TermLength = "semester" | "quarter" | "trimester" | "year";

export interface ParsedCourse {
  course_name: string;
  grade_letter: GradeLetter | null;
  term: Term | null;
  academic_year: string | null; // "YYYY-YY"
  term_length: TermLength | null;
  confidence: number; // 0.0 – 1.0
}

export interface AcceptedCourse {
  course_name: string;
  grade_letter: GradeLetter;
  term: Term | null;
  academic_year: string;
  term_length: TermLength;
}

export interface OcrParsedPayload {
  courses: ParsedCourse[];
  overall_confidence: number;
  extraction_notes: string | null;
}

export interface OcrConfidenceSummary {
  overall: number;
  per_course: number[];
  notes: string | null;
}

export const ACCEPTED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Magic-byte prefixes the upload handler validates against the Content-Type header. */
export const MAGIC_BYTE_SIGNATURES: Array<{
  mime: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  prefix: number[];
  /** WebP carries RIFF + WEBP at offsets 0 and 8 — handle as a special case. */
  variant?: "webp-riff";
}> = [
  { mime: "application/pdf", prefix: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/jpeg", prefix: [0xff, 0xd8, 0xff] },
  { mime: "image/png", prefix: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/webp", prefix: [0x52, 0x49, 0x46, 0x46], variant: "webp-riff" },
];

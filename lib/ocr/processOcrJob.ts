/**
 * Sprint 6 / Workstream B-3 — OCR job processor.
 *
 * Calls OpenAI's GPT-4o vision model to extract structured course data from
 * a transcript image / PDF. The model output is a strict JSON object whose
 * shape is enforced by the system prompt + `response_format: json_object`.
 *
 * For images (jpeg/png/webp) we send the original bytes directly. For PDFs
 * we extract page-1 text via pdfjs-dist (no native deps) and ship that as
 * text content; an image-rasterization path (pdf2pic / sharp) is left as a
 * future enhancement and tagged THRESHOLD_PENDING_VISION_PDF below.
 *
 * The function never throws — it always lands the job row in either
 * `needs_review` or `failed` so the polling client can react. We also delete
 * the temp file on every code path.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { Prisma } from "@prisma/client";
import { prismaTtg } from "@/lib/prisma";
import type { OcrParsedPayload } from "./types";

const MODEL_NAME = "gpt-4o";

const SYSTEM_PROMPT = `
You are a transcript parser for NCAA academic eligibility analysis.
Extract all courses from the provided transcript image or document.
Return ONLY valid JSON — no preamble, no markdown fences.
Output format:
{
  "courses": [
    {
      "course_name": string,
      "grade_letter": "A" | "B" | "C" | "D" | "F" | "IP" | null,
      "term": "fall" | "spring" | "summer" | null,
      "academic_year": string | null,  // format: "YYYY-YY" e.g. "2023-24"
      "term_length": "semester" | "quarter" | "trimester" | "year" | null,
      "confidence": number  // 0.0–1.0 — your confidence in this extraction
    }
  ],
  "overall_confidence": number,
  "extraction_notes": string | null
}
`;

export interface ProcessOcrJobInput {
  jobId: string;
  /** Absolute path to the temp file written by the upload handler. */
  filePath: string;
  /** MIME determined by the upload handler (already magic-byte verified). */
  mime: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
}

export async function processOcrJob({
  jobId,
  filePath,
  mime,
}: ProcessOcrJobInput): Promise<void> {
  try {
    await prismaTtg.ocrJob.update({
      where: { id: jobId },
      data: { status: "processing" },
    });

    const fileBytes = await fs.readFile(filePath);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not configured. Add it in the Cursor Cloud Agent Secrets dashboard."
      );
    }

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userContent =
      mime === "application/pdf"
        ? await buildPdfUserContent(fileBytes)
        : buildImageUserContent(fileBytes, mime);

    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = parseAndValidate(raw);

    await prismaTtg.ocrJob.update({
      where: { id: jobId },
      data: {
        status: "needs_review",
        parsed_courses: parsed.courses as unknown as Prisma.InputJsonValue,
        confidence_scores: {
          overall: parsed.overall_confidence,
          per_course: parsed.courses.map((c) => c.confidence),
          notes: parsed.extraction_notes,
        } as Prisma.InputJsonValue,
        raw_text: raw,
        error: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown OCR error";
    await prismaTtg.ocrJob
      .update({
        where: { id: jobId },
        data: { status: "failed", error: message },
      })
      .catch(() => {
        // Best-effort failure write — if even this update fails we don't
        // want to mask the original error.
      });
  } finally {
    // Always delete the temp file. We never persist transcript bytes — the
    // raw_text column is the audit trail of what GPT-4o saw.
    await fs.rm(filePath, { force: true }).catch(() => undefined);
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

type UserContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | {
          type: "image_url";
          image_url: { url: string; detail?: "low" | "high" | "auto" };
        }
    >;

function buildImageUserContent(bytes: Buffer, mime: string): UserContent {
  const base64 = bytes.toString("base64");
  return [
    {
      type: "image_url",
      image_url: {
        url: `data:${mime};base64,${base64}`,
        detail: "high",
      },
    },
    { type: "text", text: "Extract all courses from this transcript." },
  ];
}

async function buildPdfUserContent(bytes: Buffer): Promise<UserContent> {
  // THRESHOLD_PENDING_VISION_PDF: the spec asks us to convert page 1 to an
  // image for the vision model. pdf2pic + ImageMagick / Ghostscript is a
  // system dep we'd rather not pull onto Vercel functions. Fallback path
  // (per spec): extract page-1 text via pdfjs-dist and send as text.
  const text = await extractPdfText(bytes);
  if (!text || text.trim().length === 0) {
    throw new Error(
      "Could not extract text from PDF. Re-upload as an image (JPEG/PNG/WebP)."
    );
  }
  return [
    {
      type: "text",
      text:
        "The user uploaded a PDF transcript. Below is the extracted page-1 text. " +
        "Parse all courses and return JSON in the documented format.\n\n" +
        text,
    },
  ];
}

async function extractPdfText(bytes: Buffer): Promise<string> {
  // Use the legacy build of pdfjs because the modern ESM build assumes a DOM
  // worker. The legacy build is compiled for Node and works inline.
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as {
    getDocument: (params: { data: Uint8Array }) => {
      promise: Promise<{
        numPages: number;
        getPage: (n: number) => Promise<{
          getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
        }>;
      }>;
    };
  };
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes),
  });
  const pdf = await loadingTask.promise;
  // Extract every page so multi-page transcripts aren't silently truncated.
  const pages = Math.min(pdf.numPages, 10);
  const out: string[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out.push(content.items.map((it) => it.str ?? "").join(" "));
  }
  return out.join("\n\n").trim();
}

function parseAndValidate(raw: string): OcrParsedPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model returned non-JSON output");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model returned an empty payload");
  }
  const root = parsed as Partial<OcrParsedPayload>;
  if (!Array.isArray(root.courses)) {
    throw new Error("Model output missing courses array");
  }
  return {
    courses: root.courses.map((c, idx) => ({
      course_name: typeof c.course_name === "string" ? c.course_name : `Row ${idx + 1}`,
      grade_letter:
        c.grade_letter === "A" ||
        c.grade_letter === "B" ||
        c.grade_letter === "C" ||
        c.grade_letter === "D" ||
        c.grade_letter === "F" ||
        c.grade_letter === "IP"
          ? c.grade_letter
          : null,
      term:
        c.term === "fall" || c.term === "spring" || c.term === "summer"
          ? c.term
          : null,
      academic_year: typeof c.academic_year === "string" ? c.academic_year : null,
      term_length:
        c.term_length === "semester" ||
        c.term_length === "quarter" ||
        c.term_length === "trimester" ||
        c.term_length === "year"
          ? c.term_length
          : null,
      confidence:
        typeof c.confidence === "number" && c.confidence >= 0 && c.confidence <= 1
          ? c.confidence
          : 0.5,
    })),
    overall_confidence:
      typeof root.overall_confidence === "number" ? root.overall_confidence : 0.5,
    extraction_notes:
      typeof root.extraction_notes === "string" ? root.extraction_notes : null,
  };
}

/**
 * Helper used by the upload route — writes the uploaded buffer to a temp
 * file and returns the absolute path. The processor is responsible for
 * deleting the file in its `finally` block.
 */
export async function persistTempUpload(
  jobId: string,
  bytes: Uint8Array,
  mime: string
): Promise<string> {
  const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1];
  const filePath = path.join(os.tmpdir(), `ttg-ocr-${jobId}.${ext}`);
  await fs.writeFile(filePath, bytes);
  return filePath;
}

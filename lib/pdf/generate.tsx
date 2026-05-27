/**
 * Sprint 5 — server-side PDF generation entry point.
 *
 * `@react-pdf/renderer` is loaded lazily so its heavy native dependency graph
 * is only evaluated inside the Node.js runtime when an export is actually
 * requested. The rendering itself happens server-side and produces a single
 * Buffer that the API layer persists into `pdf_export_jobs.pdf_buffer`.
 */

import * as React from "react";
import {
  buildAllStudentBriefings,
  buildStudentBriefing,
  type StudentBriefingRecord,
} from "@/lib/eligibility/build-student-briefing";
import { StudentBriefingPdf } from "./StudentBriefingPdf";
import { CohortSummaryPdf } from "./CohortSummaryPdf";

async function renderToBuffer(element: React.ReactElement): Promise<Buffer> {
  // Defer import: keeps Edge bundle clean and pulls the native deps only when we render.
  const { renderToBuffer } = await import("@react-pdf/renderer");
  return renderToBuffer(element);
}

export interface GenerateStudentBriefingArgs {
  studentId: string;
  advisorName: string;
}

export interface GenerateStudentBriefingResult {
  found: boolean;
  buffer: Buffer | null;
  record: StudentBriefingRecord | null;
}

export async function generateStudentBriefingPdf(
  args: GenerateStudentBriefingArgs
): Promise<GenerateStudentBriefingResult> {
  const result = await buildStudentBriefing(args.studentId);
  if (!result.found) return { found: false, buffer: null, record: null };

  const buffer = await renderToBuffer(
    <StudentBriefingPdf
      record={result.record}
      advisorName={args.advisorName}
      generatedAt={new Date()}
    />
  );

  return { found: true, buffer, record: result.record };
}

export interface GenerateCohortSummaryArgs {
  advisorName: string;
  districtName: string;
}

export async function generateCohortSummaryPdf(
  args: GenerateCohortSummaryArgs
): Promise<{ buffer: Buffer; records: StudentBriefingRecord[] }> {
  const records = await buildAllStudentBriefings();
  const buffer = await renderToBuffer(
    <CohortSummaryPdf
      records={records}
      advisorName={args.advisorName}
      districtName={args.districtName}
      generatedAt={new Date()}
    />
  );
  return { buffer, records };
}

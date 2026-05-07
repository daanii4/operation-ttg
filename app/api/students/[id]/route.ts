/**
 * GET /api/students/[id]
 *
 * Returns full F5 result for a single student including derivation trace.
 * The derivation object powers the transparency layer ("how is this computed?").
 */

import { NextResponse } from "next/server";
import { computeAllDemoResults } from "@/lib/seed/demo-data";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const all = computeAllDemoResults();
  const found = all.find((r) => r.studentId === params.id);

  if (!found) {
    return NextResponse.json(
      { error: "Student not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json(found);
}

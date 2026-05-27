import { NextResponse } from "next/server";
import {
  buildCohortResponse,
  type CohortApiResponse,
} from "@/lib/cohort/build-cohort-response";
export type {
  CohortStudentRow,
  LockBucket,
  CohortApiResponse,
} from "@/lib/cohort/build-cohort-response";

export async function GET(): Promise<NextResponse<CohortApiResponse>> {
  const data = await buildCohortResponse();
  return NextResponse.json(data);
}

/**
 * Sprint 7 / Workstream ML-4 — score computation + persistence.
 *
 * Called from /api/students/[id]/eligibility after F12. Fire-and-forget so
 * the response time is unaffected: the caller awaits nothing and uses
 * `.catch()` to log a missed score without blocking advisors who refresh
 * faster than the DB can write.
 */

import { Prisma } from "@prisma/client";
import { prismaTtg } from "@/lib/prisma";
import {
  DEFAULT_CONFIDENCE_MARGIN,
  MODEL_VERSION,
  scoreStudent,
} from "./logisticModel";
import type { FeatureVector } from "./extractFeatureVector";

export interface ComputeMlScoreOptions {
  /** Confidence margin pulled from the threshold table. */
  confidenceMargin?: number;
}

export async function computeMlScore(
  studentId: string,
  features: FeatureVector,
  options: ComputeMlScoreOptions = {}
) {
  const margin = options.confidenceMargin ?? DEFAULT_CONFIDENCE_MARGIN;
  const result = scoreStudent(features, { confidenceMargin: margin });

  const row = await prismaTtg.mlTrajectoryScore.create({
    data: {
      student_id: studentId,
      score: result.score,
      confidence_lower: result.confidence_lower,
      confidence_upper: result.confidence_upper,
      feature_vector: features as unknown as Prisma.InputJsonValue,
      model_version: MODEL_VERSION,
      risk_tier: result.risk_tier,
    },
  });
  return row;
}

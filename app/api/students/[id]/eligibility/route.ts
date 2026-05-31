import { NextResponse } from "next/server";
import { handleAuthError, notFoundResponse } from "@/lib/auth/api-errors";
import { requireTtgSession } from "@/lib/auth/session";
import { loadEscalationMeta } from "@/lib/briefings/load-escalation-meta";
import {
  buildStudentBriefing,
  type BriefingThresholds,
} from "@/lib/eligibility/build-student-briefing";
import {
  THRESHOLD_KEYS,
  getThresholdMap,
} from "@/lib/config/thresholds";

export const dynamic = "force-dynamic";

const ALL_KEYS = Object.values(THRESHOLD_KEYS);

async function loadThresholds(): Promise<BriefingThresholds> {
  // Sprint 7 / Workstream T-4: a single round-trip pulls every threshold
  // the calculation pipeline needs. Missing keys fall back to in-code
  // defaults so a never-seeded environment still produces results — the
  // first dashboard load surfaces a console hint to run `seed:thresholds`.
  try {
    const map = await getThresholdMap(ALL_KEYS);
    return {
      lowEngagementCutoff: map.get(THRESHOLD_KEYS.F11_LOW_ENGAGEMENT_CUTOFF),
      yellowActionWeeks: map.get(THRESHOLD_KEYS.F12_YELLOW_ACTION_WEEKS),
      aimsPctDelta: map.get(THRESHOLD_KEYS.F10_PCT_DELTA_THRESHOLD),
      mlConfidenceMargin: map.get(THRESHOLD_KEYS.ML_CONFIDENCE_MARGIN),
    };
  } catch (err) {
    console.warn(
      "[eligibility] threshold table unavailable; falling back to in-code defaults",
      err
    );
    return {};
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireTtgSession();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const thresholds = await loadThresholds();
    const result = await buildStudentBriefing(params.id, thresholds);
    if (!result.found) return notFoundResponse();

    const { record } = result;
    return NextResponse.json({
      ...record.bundle,
      f8: record.f8,
      f9: record.f9,
      f10: record.f10,
      f11: record.f11,
      f12: record.f12,
      ml: record.ml,
      computedAt: record.computedAt,
      observations: record.observations,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Eligibility computation failed", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

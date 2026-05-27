import { NextResponse } from "next/server";
import { getTtgSession } from "@/lib/auth/session";
import { z } from "zod";
import type { NcaaChecklistItemKey } from "@prisma/client";
import { prismaTtg } from "@/lib/prisma";
import { computeAllDemoResults } from "@/lib/seed/demo-data";
import {
  NCAA_CHECKLIST_ITEMS,
  NCAA_CHECKLIST_INCOMPLETE_WARNING,
  computeChecklistEventHash,
  deriveChecklistSummary,
  type NcaaChecklistState,
} from "@/lib/eligibility/ncaa-checklist";

export const dynamic = "force-dynamic";

const ITEM_KEYS = NCAA_CHECKLIST_ITEMS.map((item) => item.key) as [
  NcaaChecklistItemKey,
  ...NcaaChecklistItemKey[]
];

const PatchSchema = z.object({
  itemKey: z.enum(ITEM_KEYS),
  checked: z.boolean(),
});

function defaultChecklistState(): NcaaChecklistState {
  return {
    account_created: false,
    ncaa_id_obtained: false,
    official_transcript_sent: false,
    amateurism_questionnaire_completed: false,
    fee_waiver_applied_if_applicable: false,
  };
}

function mapDbStateToChecklist(row: {
  accountCreated: boolean;
  ncaaIdObtained: boolean;
  officialTranscriptSent: boolean;
  amateurismQuestionnaireComplete: boolean;
  feeWaiverAppliedIfApplicable: boolean;
}): NcaaChecklistState {
  return {
    account_created: row.accountCreated,
    ncaa_id_obtained: row.ncaaIdObtained,
    official_transcript_sent: row.officialTranscriptSent,
    amateurism_questionnaire_completed: row.amateurismQuestionnaireComplete,
    fee_waiver_applied_if_applicable: row.feeWaiverAppliedIfApplicable,
  };
}

function applyToggle(
  prev: NcaaChecklistState,
  itemKey: NcaaChecklistItemKey,
  checked: boolean
): NcaaChecklistState {
  return { ...prev, [itemKey]: checked };
}

function getStudentProfileForChecklist(studentId: string): {
  grade: number;
  targetDivision: string;
} | null {
  const student = computeAllDemoResults().find((row) => row.studentId === studentId);
  if (!student) return null;
  return {
    grade: student.grade,
    targetDivision: student.targetDivision,
  };
}

function responsePayload(params: {
  studentId: string;
  state: NcaaChecklistState;
  grade: number;
  targetDivision: string;
  lastUpdatedAt?: string;
}): {
  studentId: string;
  state: NcaaChecklistState;
  summary: ReturnType<typeof deriveChecklistSummary>;
  warning: string | null;
  lastUpdatedAt: string | null;
} {
  const summary = deriveChecklistSummary({
    grade: params.grade,
    targetDivision: params.targetDivision,
    state: params.state,
  });
  return {
    studentId: params.studentId,
    state: params.state,
    summary,
    warning: summary.officialReviewBlocked ? NCAA_CHECKLIST_INCOMPLETE_WARNING : null,
    lastUpdatedAt: params.lastUpdatedAt ?? null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const studentMeta = getStudentProfileForChecklist(params.id);
  if (!studentMeta) {
    return NextResponse.json(
      { error: "Student not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const stateRow = await prismaTtg.ncaEligibilityChecklistState
    .findUnique({
      where: { studentId: params.id },
      select: {
        accountCreated: true,
        ncaaIdObtained: true,
        officialTranscriptSent: true,
        amateurismQuestionnaireComplete: true,
        feeWaiverAppliedIfApplicable: true,
        updatedAt: true,
      },
    })
    .catch(() => null);

  const state = stateRow ? mapDbStateToChecklist(stateRow) : defaultChecklistState();
  return NextResponse.json(
    responsePayload({
      studentId: params.id,
      state,
      grade: studentMeta.grade,
      targetDivision: studentMeta.targetDivision,
      lastUpdatedAt: stateRow?.updatedAt.toISOString(),
    })
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const studentMeta = getStudentProfileForChecklist(params.id);
  if (!studentMeta) {
    return NextResponse.json(
      { error: "Student not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const parse = PatchSchema.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", detail: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { itemKey, checked } = parse.data;
  const actorId = session.userId;
  const actorName = session.name ?? session.email ?? "Advisor";

  const result = await prismaTtg.$transaction(async (tx) => {
    const stateRecord = await tx.ncaEligibilityChecklistState.upsert({
      where: { studentId: params.id },
      update: {},
      create: { studentId: params.id },
      select: {
        id: true,
        accountCreated: true,
        ncaaIdObtained: true,
        officialTranscriptSent: true,
        amateurismQuestionnaireComplete: true,
        feeWaiverAppliedIfApplicable: true,
      },
    });

    const currentState = mapDbStateToChecklist(stateRecord);
    const nextState = applyToggle(currentState, itemKey, checked);
    const now = new Date();

    const latestEvent = await tx.ncaEligibilityChecklistEvent.findFirst({
      where: { stateId: stateRecord.id },
      orderBy: { createdAt: "desc" },
      select: { eventHash: true },
    });

    const eventHash = computeChecklistEventHash({
      studentId: params.id,
      itemKey,
      checked,
      actorId,
      createdAtIso: now.toISOString(),
      previousHash: latestEvent?.eventHash ?? null,
    });

    await tx.ncaEligibilityChecklistEvent.create({
      data: {
        stateId: stateRecord.id,
        studentId: params.id,
        itemKey,
        checked,
        actorId,
        actorName,
        sourceContext: "advisor_toggle",
        previousHash: latestEvent?.eventHash ?? null,
        eventHash,
        createdAt: now,
      },
    });

    const updated = await tx.ncaEligibilityChecklistState.update({
      where: { studentId: params.id },
      data: {
        accountCreated: nextState.account_created,
        ncaaIdObtained: nextState.ncaa_id_obtained,
        officialTranscriptSent: nextState.official_transcript_sent,
        amateurismQuestionnaireComplete: nextState.amateurism_questionnaire_completed,
        feeWaiverAppliedIfApplicable: nextState.fee_waiver_applied_if_applicable,
        updatedByActorId: actorId,
        updatedAt: now,
      },
      select: {
        accountCreated: true,
        ncaaIdObtained: true,
        officialTranscriptSent: true,
        amateurismQuestionnaireComplete: true,
        feeWaiverAppliedIfApplicable: true,
        updatedAt: true,
      },
    });

    return {
      state: mapDbStateToChecklist(updated),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }).catch(() => null);

  if (!result) {
    return NextResponse.json(
      { error: "Checklist persistence unavailable", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    responsePayload({
      studentId: params.id,
      state: result.state,
      grade: studentMeta.grade,
      targetDivision: studentMeta.targetDivision,
      lastUpdatedAt: result.updatedAt,
    })
  );
}

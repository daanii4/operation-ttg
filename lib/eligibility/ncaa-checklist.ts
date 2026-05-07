import { createHash } from "node:crypto";
import type { NcaaChecklistItemKey, TargetDivision } from "@prisma/client";

export const NCAA_CHECKLIST_ITEMS: Array<{
  key: NcaaChecklistItemKey;
  title: string;
  description: string;
}> = [
  {
    key: "account_created",
    title: "Account created",
    description:
      "Student has registered at eligibilitycenter.org with an Academic and Athletics Certification account (required for D1 and D2 competition; $110 for U.S. students).",
  },
  {
    key: "ncaa_id_obtained",
    title: "NCAA ID obtained",
    description:
      "Unique NCAA ID number received after registration.",
  },
  {
    key: "official_transcript_sent",
    title: "Official transcript sent",
    description:
      "High school has sent official transcript directly to the Eligibility Center. This usually requires counselor coordination.",
  },
  {
    key: "amateurism_questionnaire_completed",
    title: "Amateurism questionnaire completed",
    description:
      "Completed inside the Eligibility Center account (payments, professional exposure, and recruiting activity disclosures).",
  },
  {
    key: "fee_waiver_applied_if_applicable",
    title: "Fee waiver applied (if applicable)",
    description:
      "Students who qualify for federal free lunch can receive an NCAA registration fee waiver.",
  },
];

export type NcaaChecklistState = Record<NcaaChecklistItemKey, boolean>;

export type NcaaChecklistSummary = {
  required: boolean;
  completedCount: number;
  totalCount: number;
  incompleteKeys: NcaaChecklistItemKey[];
  officialReviewBlocked: boolean;
};

export function requiresEligibilityCenter(
  grade: number,
  targetDivision: TargetDivision | string
): boolean {
  const division =
    targetDivision === "DI" ||
    targetDivision === "DII" ||
    targetDivision === "DI_or_DII_undecided";
  return grade >= 11 && grade <= 12 && division;
}

export function deriveChecklistSummary(params: {
  grade: number;
  targetDivision: TargetDivision | string;
  state: NcaaChecklistState;
}): NcaaChecklistSummary {
  const required = requiresEligibilityCenter(params.grade, params.targetDivision);
  const incompleteKeys = NCAA_CHECKLIST_ITEMS
    .map((item) => item.key)
    .filter((key) => !params.state[key]);

  const completedCount = NCAA_CHECKLIST_ITEMS.length - incompleteKeys.length;
  const officialReviewBlocked = required && incompleteKeys.length > 0;

  return {
    required,
    completedCount,
    totalCount: NCAA_CHECKLIST_ITEMS.length,
    incompleteKeys,
    officialReviewBlocked,
  };
}

export function computeChecklistEventHash(input: {
  studentId: string;
  itemKey: NcaaChecklistItemKey;
  checked: boolean;
  actorId: string;
  createdAtIso: string;
  previousHash: string | null;
}): string {
  return createHash("sha256")
    .update(
      [
        input.studentId,
        input.itemKey,
        String(input.checked),
        input.actorId,
        input.createdAtIso,
        input.previousHash ?? "",
      ].join("|")
    )
    .digest("hex");
}

export const NCAA_CHECKLIST_INCOMPLETE_WARNING =
  "Eligibility Center account incomplete — course calculations cannot be submitted for official review until an account exists.";

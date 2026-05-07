import { prismaTtg } from "@/lib/prisma";
import { getNcaaSchoolApprovedCourses } from "@/lib/seed/ncaa-approved-courses";
import {
  deriveChecklistSummary,
  type NcaaChecklistState,
} from "@/lib/eligibility/ncaa-checklist";

type StudentLite = {
  studentId: string;
  firstName: string;
  lastName: string;
  sport: string;
  grade: number;
  targetDivision: string;
  highSchoolName: string;
  highSchoolId: string;
};

type ChecklistStateRow = {
  studentId: string;
  accountCreated: boolean;
  ncaaIdObtained: boolean;
  officialTranscriptSent: boolean;
  amateurismQuestionnaireComplete: boolean;
  feeWaiverAppliedIfApplicable: boolean;
};

function toChecklistState(row?: ChecklistStateRow): NcaaChecklistState {
  return {
    account_created: row?.accountCreated ?? false,
    ncaa_id_obtained: row?.ncaaIdObtained ?? false,
    official_transcript_sent: row?.officialTranscriptSent ?? false,
    amateurism_questionnaire_completed:
      row?.amateurismQuestionnaireComplete ?? false,
    fee_waiver_applied_if_applicable: row?.feeWaiverAppliedIfApplicable ?? false,
  };
}

export type NcaaReadinessSummary = {
  requiredStudents: number;
  incompleteStudents: number;
  completedStudents: number;
  clearedSchoolStudents: number;
  notClearedOrUnverifiedSchoolStudents: number;
  mostCommonMissingItem: string | null;
  requiredStudentsList: NcaaReadinessStudentRow[];
  incompleteChecklistStudents: NcaaReadinessStudentRow[];
  completedChecklistStudents: NcaaReadinessStudentRow[];
  schoolClearedStudents: NcaaReadinessStudentRow[];
  schoolIssueStudents: NcaaReadinessStudentRow[];
};

export type NcaaReadinessStudentRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  sport: string;
  grade: number;
  highSchoolName: string;
  targetDivision: string;
  missingItems: string[];
  schoolClearanceStatus: "cleared" | "issue";
};

const ITEM_LABELS: Record<keyof NcaaChecklistState, string> = {
  account_created: "Account created",
  ncaa_id_obtained: "NCAA ID obtained",
  official_transcript_sent: "Official transcript sent",
  amateurism_questionnaire_completed: "Amateurism questionnaire completed",
  fee_waiver_applied_if_applicable: "Fee waiver applied (if applicable)",
};

export async function computeNcaaReadinessSummary(
  students: StudentLite[]
): Promise<NcaaReadinessSummary> {
  const ids = students.map((student) => student.studentId);
  const rows = await prismaTtg.ncaEligibilityChecklistState
    .findMany({
      where: { studentId: { in: ids } },
      select: {
        studentId: true,
        accountCreated: true,
        ncaaIdObtained: true,
        officialTranscriptSent: true,
        amateurismQuestionnaireComplete: true,
        feeWaiverAppliedIfApplicable: true,
      },
    })
    .catch(() => [] as ChecklistStateRow[]);
  const byId = new Map(rows.map((row) => [row.studentId, row]));

  let requiredStudents = 0;
  let incompleteStudents = 0;
  let completedStudents = 0;
  let clearedSchoolStudents = 0;
  let notClearedOrUnverifiedSchoolStudents = 0;
  const requiredStudentsList: NcaaReadinessStudentRow[] = [];
  const incompleteChecklistStudents: NcaaReadinessStudentRow[] = [];
  const completedChecklistStudents: NcaaReadinessStudentRow[] = [];
  const schoolClearedStudents: NcaaReadinessStudentRow[] = [];
  const schoolIssueStudents: NcaaReadinessStudentRow[] = [];
  const missingCounts: Record<keyof NcaaChecklistState, number> = {
    account_created: 0,
    ncaa_id_obtained: 0,
    official_transcript_sent: 0,
    amateurism_questionnaire_completed: 0,
    fee_waiver_applied_if_applicable: 0,
  };

  for (const student of students) {
    const school = getNcaaSchoolApprovedCourses(student.highSchoolId);
    const schoolClearanceStatus = school?.schoolCleared ? "cleared" : "issue";
    const baseRow: NcaaReadinessStudentRow = {
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      sport: student.sport,
      grade: student.grade,
      highSchoolName: student.highSchoolName,
      targetDivision: student.targetDivision,
      missingItems: [],
      schoolClearanceStatus,
    };

    if (school?.schoolCleared) clearedSchoolStudents += 1;
    else notClearedOrUnverifiedSchoolStudents += 1;
    if (schoolClearanceStatus === "cleared") schoolClearedStudents.push(baseRow);
    else schoolIssueStudents.push(baseRow);

    const state = toChecklistState(byId.get(student.studentId));
    const summary = deriveChecklistSummary({
      grade: student.grade,
      targetDivision: student.targetDivision,
      state,
    });
    if (!summary.required) continue;

    requiredStudents += 1;
    const missingItems = summary.incompleteKeys.map((key) => ITEM_LABELS[key]);
    const requiredRow: NcaaReadinessStudentRow = {
      ...baseRow,
      missingItems,
    };
    requiredStudentsList.push(requiredRow);

    if (summary.officialReviewBlocked) {
      incompleteStudents += 1;
      incompleteChecklistStudents.push(requiredRow);
      for (const key of summary.incompleteKeys) {
        missingCounts[key] += 1;
      }
    } else {
      completedStudents += 1;
      completedChecklistStudents.push(requiredRow);
    }
  }

  const sorted = Object.entries(missingCounts).sort((a, b) => b[1] - a[1]);
  const mostCommonMissingItem =
    sorted[0] && sorted[0][1] > 0
      ? ITEM_LABELS[sorted[0][0] as keyof NcaaChecklistState]
      : null;

  return {
    requiredStudents,
    incompleteStudents,
    completedStudents,
    clearedSchoolStudents,
    notClearedOrUnverifiedSchoolStudents,
    mostCommonMissingItem,
    requiredStudentsList,
    incompleteChecklistStudents,
    completedChecklistStudents,
    schoolClearedStudents,
    schoolIssueStudents,
  };
}

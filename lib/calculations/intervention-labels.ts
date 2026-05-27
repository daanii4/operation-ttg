import type { InterventionCode } from "./types";

export const INTERVENTION_LABELS: Record<InterventionCode, string> = {
  IMMEDIATE_ADVISOR_CONTACT: "Immediate advisor contact required",
  SCHEDULE_ACADEMIC_SUPPORT: "Schedule academic support session",
  MONITOR_ENGAGEMENT: "Monitor engagement — pattern emerging",
  GPA_RECOVERY_PLAN: "GPA recovery plan needed",
  AIMS_FOLLOW_UP: "AIMS follow-up assessment recommended",
  TRANSCRIPT_AUDIT: "Transcript audit required — insufficient grade data",
  D1_PATHWAY_REVIEW: "D1 eligibility pathway review required",
  NO_ACTION_REQUIRED: "On track — no immediate action required",
};

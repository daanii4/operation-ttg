/**
 * Mappers from F1/F3/F6 results to CompletionCard rows + per-row derivations.
 */

import type { F1Result } from "@/lib/calculations/f1";
import type { F3Result } from "@/lib/calculations/f3";
import type { F6Result } from "@/lib/calculations/f6";
import type { SubjectRow } from "./CompletionCard";
import { CALIFORNIA_AG_AUTHORITY, NCAA_BYLAW_14_3 } from "@/lib/config/ncaa-authority";

const AG_LABELS: Record<string, string> = {
  a: "History / Social Science",
  b: "English",
  c: "Mathematics",
  d: "Laboratory Science",
  e: "Foreign Language",
  f: "Visual / Performing Arts",
  g: "College-Preparatory Elective",
};

const AG_ORDER: Array<keyof typeof AG_LABELS> = ["b", "c", "d", "e", "f", "a", "g"];

const NCAA_LABELS: Record<string, string> = {
  eng: "English",
  math: "Mathematics",
  sci: "Natural / Physical Science",
  addl_ems: "Additional Eng / Math / Sci",
  soc_sci: "Social Science",
  addl_any: "Additional Core",
};

const NCAA_ORDER = [
  "eng",
  "math",
  "sci",
  "addl_ems",
  "soc_sci",
  "addl_any",
] as const;

function rowFromCategory(
  key: string,
  label: string,
  completed: number,
  required: number,
  complete: boolean,
  insufficient: boolean,
  sourceLabel: string
): SubjectRow {
  return {
    key,
    label,
    completed,
    required,
    satisfied: complete,
    insufficient,
    derivationTitle: `${label} completion`,
    derivationBody: insufficient
      ? "Insufficient evidence to count years in this category."
      : `${completed.toFixed(1)} of ${required.toFixed(1)} required years completed in ${label}. ` +
        (complete
          ? "Requirement met for this category."
          : `${(required - completed).toFixed(1)} year(s) still needed.`) +
        ` Source: ${sourceLabel}.`,
  };
}

export function agRowsFromF1(f1: F1Result | null | undefined): SubjectRow[] {
  if (!f1) return [];
  const insufficient = f1.evidenceTier === "Insufficient";
  return AG_ORDER.map((key) => {
    const cat = f1.perCategory[key];
    if (!cat) return null;
    return rowFromCategory(
      `ag-${key}`,
      AG_LABELS[key] ?? key.toUpperCase(),
      cat.completedYears,
      cat.requiredYears,
      cat.complete,
      insufficient,
      CALIFORNIA_AG_AUTHORITY.sourceLabel
    );
  }).filter((r): r is SubjectRow => r !== null);
}

export function ncaaRowsFromF3(f3: F3Result | null | undefined): SubjectRow[] {
  if (!f3 || !f3.applicable) return [];
  const insufficient = f3.evidenceTier === "Insufficient";
  return NCAA_ORDER.map((key) => {
    const cat = f3.perCategory[key];
    if (!cat) return null;
    return rowFromCategory(
      `ncaa-d1-${key}`,
      NCAA_LABELS[key] ?? key,
      cat.completedYears,
      cat.requiredYears,
      cat.complete,
      insufficient,
      NCAA_BYLAW_14_3.sourceLabel
    );
  }).filter((r): r is SubjectRow => r !== null);
}

export function ncaaRowsFromF6(f6: F6Result | null | undefined): SubjectRow[] {
  if (!f6 || !f6.applicable) return [];
  const insufficient = f6.evidenceTier === "Insufficient";
  return NCAA_ORDER.map((key) => {
    const cat = f6.perCategory[key];
    if (!cat) return null;
    return rowFromCategory(
      `ncaa-d2-${key}`,
      NCAA_LABELS[key] ?? key,
      cat.completedYears,
      cat.requiredYears,
      cat.complete,
      insufficient,
      NCAA_BYLAW_14_3.sourceLabel
    );
  }).filter((r): r is SubjectRow => r !== null);
}

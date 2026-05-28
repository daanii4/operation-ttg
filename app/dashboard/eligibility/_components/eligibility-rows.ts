/**
 * Sprint 6 / A4-3 — pure mappers from F1/F3/F6 results to the
 * <CompletionCard /> SubjectRow shape.
 *
 * Kept in a separate file (no React) so the mappings are easy to unit-test
 * later if we want — and so the card component itself stays presentational.
 */

import type { F1Result } from "@/lib/calculations/f1";
import type { F3Result } from "@/lib/calculations/f3";
import type { F6Result } from "@/lib/calculations/f6";
import type { SubjectRow } from "./CompletionCard";

const AG_LABELS: Record<string, string> = {
  a: "History / Social Science",
  b: "English",
  c: "Mathematics",
  d: "Laboratory Science",
  e: "Foreign Language",
  f: "Visual / Performing Arts",
  g: "College-Preparatory Elective",
};

const AG_ORDER: Array<keyof typeof AG_LABELS> = [
  "b", // English first — matches UC's documentation order
  "c", // Math
  "d", // Lab Science
  "e", // Foreign Language
  "f", // Visual / Performing Arts
  "a", // History / Social Science
  "g", // Elective
];

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

export function agRowsFromF1(f1: F1Result | null | undefined): SubjectRow[] {
  if (!f1) return [];
  return AG_ORDER.map((key) => {
    const cat = f1.perCategory[key];
    if (!cat) return null;
    return {
      key: `ag-${key}`,
      label: AG_LABELS[key] ?? key.toUpperCase(),
      completed: cat.completedYears,
      required: cat.requiredYears,
    } satisfies SubjectRow;
  }).filter((r): r is SubjectRow => r !== null);
}

export function ncaaRowsFromF3(f3: F3Result | null | undefined): SubjectRow[] {
  if (!f3 || !f3.applicable) return [];
  return NCAA_ORDER.map((key) => {
    const cat = f3.perCategory[key];
    if (!cat) return null;
    return {
      key: `ncaa-d1-${key}`,
      label: NCAA_LABELS[key] ?? key,
      completed: cat.completedYears,
      required: cat.requiredYears,
    } satisfies SubjectRow;
  }).filter((r): r is SubjectRow => r !== null);
}

export function ncaaRowsFromF6(f6: F6Result | null | undefined): SubjectRow[] {
  if (!f6) return [];
  // F6 mirrors F3's per-category map but for D2 thresholds.
  return NCAA_ORDER.map((key) => {
    const cat = f6.perCategory[key];
    if (!cat) return null;
    return {
      key: `ncaa-d2-${key}`,
      label: NCAA_LABELS[key] ?? key,
      completed: cat.completedYears,
      required: cat.requiredYears,
    } satisfies SubjectRow;
  }).filter((r): r is SubjectRow => r !== null);
}

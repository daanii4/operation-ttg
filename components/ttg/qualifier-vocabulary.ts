import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import type { BandKey } from "@/components/ui/Badge";

export type QualifierStatusKey =
  | "FULL_QUALIFIER"
  | "PARTIAL_QUALIFIER"
  | "ACADEMIC_REDSHIRT"
  | "NONQUALIFIER";

export type QualifierVocabulary = {
  label: string;
  band: BandKey;
  icon: LucideIcon;
};

export const QUALIFIER_VOCABULARY: Record<QualifierStatusKey, QualifierVocabulary> = {
  FULL_QUALIFIER: {
    label: "Full Qualifier",
    band: "green",
    icon: CheckCircle,
  },
  PARTIAL_QUALIFIER: {
    label: "Partial Qualifier",
    band: "yellow",
    icon: TrendingDown,
  },
  ACADEMIC_REDSHIRT: {
    label: "Partial Qualifier",
    band: "yellow",
    icon: TrendingDown,
  },
  NONQUALIFIER: {
    label: "Nonqualifier",
    band: "red",
    icon: AlertTriangle,
  },
};

export function qualifierVocabularyFor(
  status: string | null | undefined
): QualifierVocabulary | null {
  if (!status) return null;
  return QUALIFIER_VOCABULARY[status as QualifierStatusKey] ?? null;
}

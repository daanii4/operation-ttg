import {
  AlertTriangle,
  CheckCircle,
  GitBranch,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import type { BandKey } from "@/components/ui/Badge";

export type RiskBand = "GREEN" | "YELLOW" | "RED" | "LOCKED";

export type RiskVocabulary = {
  label: string;
  subLabel: string;
  icon: LucideIcon;
  band: BandKey;
};

export const RISK_VOCABULARY: Record<RiskBand, RiskVocabulary> = {
  GREEN: {
    label: "On Track",
    subLabel: "Universal Support",
    icon: CheckCircle,
    band: "green",
  },
  YELLOW: {
    label: "Off Track - Recoverable",
    subLabel: "Targeted Support",
    icon: TrendingDown,
    band: "yellow",
  },
  RED: {
    label: "Off Track - Critical",
    subLabel: "Intensive Support",
    icon: AlertTriangle,
    band: "red",
  },
  LOCKED: {
    label: "Pivot Required",
    subLabel: "Alternative Pathway",
    icon: GitBranch,
    band: "locked",
  },
};

import type { AuthorityCitation } from "@/lib/config/ncaa-authority";
import {
  CALIFORNIA_AG_AUTHORITY,
  NCAA_BYLAW_14_3,
} from "@/lib/config/ncaa-authority";
import type { F1Result } from "@/lib/calculations/f1";
import type { F3Result } from "@/lib/calculations/f3";
import type { F4Result } from "@/lib/calculations/f4";
import type { F6Result } from "@/lib/calculations/f6";
import type { F7Result } from "@/lib/calculations/f7";
import type { EvidenceTier } from "@/lib/calculations/types";
import type { CompositeRiskBand } from "@/components/ttg/risk-vocabulary";
import type { EvidenceTier as ChipTier } from "@/components/ui/qn";

export type FrameworkVerdict = {
  band: CompositeRiskBand | null;
  notApplicable: boolean;
  insufficient: boolean;
  provisional: boolean;
  provisionalReason: string | null;
  chipTier: ChipTier;
  source: AuthorityCitation;
  verdictTitle: string;
  verdictBody: string;
};

export function toChipTier(tier: EvidenceTier): ChipTier {
  if (tier === "Insufficient" || tier === "Not_Applicable") return "Insufficient";
  if (tier === "Provisional") return "Provisional";
  return "Deterministic";
}

function deriveCompletionBand(args: {
  applicable: boolean;
  fullyComplete: boolean;
  totalCompleted: number;
  totalRequired: number;
  evidenceTier: EvidenceTier;
}): Pick<FrameworkVerdict, "band" | "notApplicable" | "insufficient"> {
  if (!args.applicable) {
    return { band: null, notApplicable: true, insufficient: false };
  }
  if (args.evidenceTier === "Insufficient") {
    return { band: null, notApplicable: false, insufficient: true };
  }
  if (args.fullyComplete) {
    return { band: "GREEN", notApplicable: false, insufficient: false };
  }
  if (args.totalCompleted <= 0) {
    return { band: "RED", notApplicable: false, insufficient: false };
  }
  const ratio =
    args.totalRequired > 0 ? args.totalCompleted / args.totalRequired : 0;
  if (ratio >= 0.9) {
    return { band: "YELLOW", notApplicable: false, insufficient: false };
  }
  return { band: "RED", notApplicable: false, insufficient: false };
}

function provisionalReasonFromStale(staleCount: number): string | null {
  if (staleCount <= 0) return null;
  return `${staleCount} course classification(s) exceed the 365-day verification window — counts are provisional until re-verified.`;
}

export function frameworkVerdictFromF1(f1: F1Result | null | undefined): FrameworkVerdict | null {
  if (!f1) return null;
  const base = deriveCompletionBand({
    applicable: true,
    fullyComplete: f1.fullyComplete,
    totalCompleted: f1.totalCompletedYears,
    totalRequired: f1.totalRequiredYears,
    evidenceTier: f1.evidenceTier,
  });
  const missingCats = Object.values(f1.perCategory).filter((c) => !c.complete);
  const verdictBody = base.insufficient
    ? "Insufficient transcript or classification evidence to compute A-G completion. Upload or verify course records before relying on this verdict."
    : `Completed ${f1.totalCompletedYears.toFixed(1)} of ${f1.totalRequiredYears} required A-G years across seven subject areas. ` +
      (missingCats.length > 0
        ? `${missingCats.length} subject area(s) still below the published UC/CSU minimum.`
        : "All subject areas meet published year requirements.") +
      (f1.provisionalFlag
        ? " Stale classifications are applied — see Provisional chip."
        : "");

  return {
    ...base,
    provisional: f1.provisionalFlag || f1.evidenceTier === "Provisional",
    provisionalReason: provisionalReasonFromStale(f1.staleClassificationCount),
    chipTier: toChipTier(f1.evidenceTier),
    source: CALIFORNIA_AG_AUTHORITY,
    verdictTitle: "California A-G completion",
    verdictBody,
  };
}

export function frameworkVerdictFromF3(f3: F3Result | null | undefined): FrameworkVerdict | null {
  if (!f3) return null;
  const base = deriveCompletionBand({
    applicable: f3.applicable,
    fullyComplete: f3.fullyComplete,
    totalCompleted: f3.totalCompleted,
    totalRequired: f3.totalRequired,
    evidenceTier: f3.evidenceTier,
  });
  const verdictBody = base.notApplicable
    ? "Student is not targeting NCAA Division I — this framework does not apply to the declared division intent."
    : base.insufficient
      ? "Insufficient NCAA core classification evidence to compute D1 completion."
      : `Completed ${f3.totalCompleted.toFixed(1)} of ${f3.totalRequired} required D1 core years. ` +
        (f3.geometrySatisfied
          ? "English / math / science geometry is satisfied."
          : "English / math / science geometry is not yet satisfied — see category rows.") +
        (f3.provisionalFlag ? " Stale NCAA classifications are applied." : "");

  return {
    ...base,
    provisional: f3.provisionalFlag || f3.evidenceTier === "Provisional",
    provisionalReason: provisionalReasonFromStale(f3.staleClassificationCount),
    chipTier: toChipTier(f3.evidenceTier),
    source: NCAA_BYLAW_14_3,
    verdictTitle: "NCAA Division I core completion",
    verdictBody,
  };
}

export function frameworkVerdictFromF6(f6: F6Result | null | undefined): FrameworkVerdict | null {
  if (!f6) return null;
  const base = deriveCompletionBand({
    applicable: f6.applicable,
    fullyComplete: f6.fullyComplete,
    totalCompleted: f6.totalCompleted,
    totalRequired: f6.totalRequired,
    evidenceTier: f6.evidenceTier,
  });
  const verdictBody = base.notApplicable
    ? "Student is not targeting NCAA Division II — this framework does not apply to the declared division intent."
    : base.insufficient
      ? "Insufficient NCAA core classification evidence to compute D2 completion."
      : `Completed ${f6.totalCompleted.toFixed(1)} of ${f6.totalRequired} required D2 core years.` +
        (f6.provisionalFlag ? " Stale NCAA classifications are applied." : "");

  return {
    ...base,
    provisional: f6.provisionalFlag || f6.evidenceTier === "Provisional",
    provisionalReason: provisionalReasonFromStale(f6.staleClassificationCount),
    chipTier: toChipTier(f6.evidenceTier),
    source: NCAA_BYLAW_14_3,
    verdictTitle: "NCAA Division II core completion",
    verdictBody,
  };
}

export function gpaDerivationFromF4(f4: F4Result | null | undefined): {
  title: string;
  body: string;
  chipTier: ChipTier;
  source: AuthorityCitation;
} | null {
  if (!f4) return null;
  if (!f4.applicable) {
    return {
      title: "NCAA D1 Core GPA",
      body: "Student is not targeting NCAA Division I — D1 core GPA qualifier does not apply.",
      chipTier: "Insufficient",
      source: NCAA_BYLAW_14_3,
    };
  }
  if (f4.evidenceTier === "Insufficient") {
    return {
      title: "NCAA D1 Core GPA",
      body: "Insufficient graded core courses in the NCAA window to compute a defensible D1 core GPA.",
      chipTier: "Insufficient",
      source: NCAA_BYLAW_14_3,
    };
  }
  return {
    title: "NCAA D1 Core GPA qualifier",
    body:
      `Weighted core GPA ${f4.coreGpaWeighted.toFixed(3)} from ${f4.coresUsedInCalc} semesters in the best-16 core selection. ` +
      `Full qualifier threshold ≥ ${f4.qualifierThresholdFull.toFixed(1)}; academic redshirt ≥ ${f4.qualifierThresholdRedshirt.toFixed(1)}. ` +
      `Status: ${f4.qualifierStatus.replace(/_/g, " ").toLowerCase()}.` +
      (f4.coresExcludedBeyond16.length > 0
        ? ` ${f4.coresExcludedBeyond16.length} course(s) excluded beyond the best-16 cap.`
        : ""),
    chipTier: toChipTier(f4.evidenceTier),
    source: NCAA_BYLAW_14_3,
  };
}

export function gpaDerivationFromF7(f7: F7Result | null | undefined): {
  title: string;
  body: string;
  chipTier: ChipTier;
  source: AuthorityCitation;
} | null {
  if (!f7) return null;
  if (!f7.applicable) {
    return {
      title: "NCAA D2 Core GPA",
      body: "Student is not targeting NCAA Division II — D2 core GPA qualifier does not apply.",
      chipTier: "Insufficient",
      source: NCAA_BYLAW_14_3,
    };
  }
  if (f7.evidenceTier === "Insufficient") {
    return {
      title: "NCAA D2 Core GPA",
      body: "Insufficient graded core courses in the NCAA window to compute a defensible D2 core GPA.",
      chipTier: "Insufficient",
      source: NCAA_BYLAW_14_3,
    };
  }
  return {
    title: "NCAA D2 Core GPA qualifier",
    body:
      `Weighted core GPA ${f7.coreGpaWeighted.toFixed(3)} from ${f7.coresUsedInCalc} semesters in the best-16 core selection. ` +
      `Full qualifier threshold ≥ ${f7.qualifierThresholdFull.toFixed(1)}. ` +
      `Status: ${f7.qualifierStatus.replace(/_/g, " ").toLowerCase()}.` +
      (f7.coresExcludedBeyond16.length > 0
        ? ` ${f7.coresExcludedBeyond16.length} course(s) excluded beyond the best-16 cap.`
        : ""),
    chipTier: toChipTier(f7.evidenceTier),
    source: NCAA_BYLAW_14_3,
  };
}

"use client";
import * as React from "react";
import type { F5Result } from "@/lib/calculations/f5";
import IdentityHeader from "@/components/ttg/IdentityHeader";
import ProvisionalAlert from "@/components/ttg/ProvisionalAlert";
import TenSevenPanel from "@/components/ttg/TenSevenPanel";
import DualFlagAlert from "@/components/ttg/DualFlagAlert";
import RecommendedCourses from "@/components/ttg/RecommendedCourses";
import EvidenceFootnote from "@/components/ttg/EvidenceFootnote";
import DerivationModal from "@/components/ttg/DerivationModal";
import HolisticHealthStrip from "@/components/ttg/HolisticHealthStrip";
import MentalHealthAlert from "@/components/ttg/MentalHealthAlert";
import FallbackPathwayPanel from "@/components/ttg/FallbackPathwayPanel";
import NcaaEligibilityCenterStatus from "@/components/ttg/NcaaEligibilityCenterStatus";
import NcaaApprovedCoursesPanel from "@/components/ttg/NcaaApprovedCoursesPanel";
import EligibilityPanels from "@/components/ttg/EligibilityPanels";
import type { HolisticStudentRisk } from "@/lib/calculations/holistic-rollup";

type ProfileData = {
  studentId: string;
  firstName: string;
  lastName: string;
  sport: string;
  grade: number;
  highSchoolId: string;
  highSchoolName: string;
  targetDivision: string;
  courses: Array<{
    id: string;
    courseName: string;
    ncaaD1Category: string | null;
  }>;
  f5: Omit<F5Result, "lockInDate" | "computedAt"> & {
    lockInDate: string | null;
    computedAt: string;
  };
  holistic: HolisticStudentRisk;
};

type DerivationField = "daysToLock" | "cores" | "emsSubset" | "riskBand";

const FIELD_TITLES: Record<DerivationField, string> = {
  daysToLock: "Days to Lock — Derivation",
  cores:      "Cores Complete — Derivation",
  emsSubset:  "Eng / Math / Sci Subset — Derivation",
  riskBand:   "Risk Band — Derivation",
};

export default function StudentProfileClient({ data }: { data: ProfileData }) {
  const { f5 } = data;
  const [field, setField] = React.useState<DerivationField | null>(null);

  const lockInDate = f5.lockInDate
    ? new Date(f5.lockInDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const provisionalReason =
    f5.lockInDateBasis === "fallback_estimate_grade9_plus_3yr"
      ? "Lock-in date estimated from grade 9 enrollment (school calendar not on file). Confirm with school registrar."
      : "One or more course classifications are over 365 days old. Re-verify with NCAA Eligibility Center.";

  const evidenceTier: "Deterministic" | "Provisional" =
    f5.evidenceTier === "Deterministic" ? "Deterministic" : "Provisional";

  const derivationBody: Record<DerivationField, string> = {
    daysToLock: f5.derivation.daysToLockExplanation,
    cores:      f5.derivation.completedCountExplanation,
    emsSubset:  f5.derivation.completedCountExplanation,
    riskBand:   f5.derivation.riskBandExplanation,
  };

  const riskBand = (f5.applicable ? f5.riskBand : "NOT_APPLICABLE") as
    | "GREEN" | "YELLOW" | "RED" | "LOCKED" | "NOT_APPLICABLE";

  return (
    <>
      <div className="mt-6">
        <IdentityHeader
          firstName={data.firstName}
          lastName={data.lastName}
          grade={data.grade}
          sport={data.sport}
          highSchool={data.highSchoolName}
          targetDivision={data.targetDivision}
          riskBand={riskBand}
        />
      </div>

      <div className="mt-6">
        <MentalHealthAlert holistic={data.holistic} />
      </div>

      {f5.provisionalFlag && (
        <div className="mt-6">
          <ProvisionalAlert reason={provisionalReason} />
        </div>
      )}

      <div className="mt-6">
        <HolisticHealthStrip holistic={data.holistic} />
      </div>

      <div className="mt-6">
        <NcaaEligibilityCenterStatus studentId={data.studentId} />
      </div>

      <div className="mt-6">
        <NcaaApprovedCoursesPanel
          highSchoolId={data.highSchoolId}
          highSchoolName={data.highSchoolName}
          studentCourses={data.courses}
        />
      </div>

      {f5.applicable && (
        <div className="mt-6">
          <TenSevenPanel
            riskBand={f5.riskBand as "GREEN" | "YELLOW" | "RED" | "LOCKED"}
            riskBandExplanation={f5.derivation.riskBandExplanation}
            daysToLock={f5.pastLock ? "Past lock" : (f5.daysToLock ?? 0)}
            lockInDate={lockInDate}
            cores={{
              completed: f5.completedTotal,
              required: f5.requiredTotal,
              missing: f5.missingTotal,
            }}
            emsSubset={{
              completed: f5.completedEngMathSci,
              required: f5.requiredEngMathSci,
              missing: f5.missingEngMathSci,
            }}
            provisionalFlag={f5.provisionalFlag}
            onOpenDerivation={(f) => setField(f)}
          />
        </div>
      )}

      {f5.agFailureDualFlags.length > 0 && (
        <div className="mt-6">
          <DualFlagAlert flags={f5.agFailureDualFlags} />
        </div>
      )}

      {f5.applicable && (
        <div className="mt-6">
          {f5.fallbackPathway ? (
            <FallbackPathwayPanel pathway={f5.fallbackPathway} />
          ) : (
            <RecommendedCourses
              courses={f5.recommendedCoursesNextTerm}
              riskBand={riskBand}
            />
          )}
        </div>
      )}

      <div className="mt-6">
        <EvidenceFootnote
          evidenceTier={evidenceTier}
          text="All calculations trace to NCAA Bylaw 14.3 or Manteca Unified School District published calendar assumptions."
          sourceUrl={f5.derivation.sourceUrl}
          sourceLabel="NCAA Bylaw 14.3"
        />
      </div>

      <DerivationModal
        open={field !== null}
        onClose={() => setField(null)}
        title={field ? FIELD_TITLES[field] : ""}
        body={field ? derivationBody[field] : ""}
        evidenceTier={evidenceTier}
        sourceUrl={f5.derivation.sourceUrl}
        sourceLabel="NCAA Bylaw 14.3"
      />
    </>
  );
}

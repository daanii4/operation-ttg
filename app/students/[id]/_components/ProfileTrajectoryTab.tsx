"use client";

import GpaTrajectoryCard from "@/app/dashboard/trajectory/_components/GpaTrajectoryCard";
import AimsSignalCard from "@/app/dashboard/trajectory/_components/AimsSignalCard";
import EngagementCard from "@/app/dashboard/trajectory/_components/EngagementCard";
import RiskForecastCard from "@/app/dashboard/trajectory/_components/RiskForecastCard";
import type { ProfileEligibilityPayload } from "../profile-types";

export function ProfileTrajectoryTab({
  eligibility,
}: {
  eligibility: ProfileEligibilityPayload | null;
}) {
  if (!eligibility) {
    return (
      <p className="py-12 text-center font-sans text-[13px] text-[var(--text-tertiary)]">
        No trajectory data yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] [&>section:last-child]:border-b-0">
      <GpaTrajectoryCard
        variant="embedded"
        f9={eligibility.f9}
        observations={eligibility.observations?.grades ?? null}
      />
      <AimsSignalCard variant="embedded" f10={eligibility.f10} />
      <EngagementCard variant="embedded" f11={eligibility.f11} />
      <RiskForecastCard variant="embedded" ml={eligibility.ml} />
    </div>
  );
}

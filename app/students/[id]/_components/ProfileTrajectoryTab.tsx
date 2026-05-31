"use client";

import GpaTrajectoryCard from "@/app/dashboard/trajectory/_components/GpaTrajectoryCard";
import type { ProfileEligibilityPayload } from "../profile-types";

/** Profile trajectory mirrors dashboard: academic GPA trend only. */
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
    <div className="overflow-hidden rounded-lg border border-[color:var(--border-default)] bg-surface-card">
      <GpaTrajectoryCard
        f9={eligibility.f9}
        observations={eligibility.observations?.grades ?? null}
      />
    </div>
  );
}

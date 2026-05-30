"use client";

import type { F9Result } from "@/lib/calculations/types";
import { trajectoryDirectionLabel } from "@/lib/calculations/display-labels";

export function TrajectoryDirectionPanel({ f9 }: { f9: F9Result | null | undefined }) {
  if (!f9 || f9.evidence_tier === "Insufficient") return null;

  const parts: string[] = [];
  parts.push(
    `Direction is ${trajectoryDirectionLabel(f9.direction).toLowerCase()} based on the F9 63-day observation window and 30-day regression.`
  );
  if (f9.regression_flag) {
    parts.push(
      "Regression is flagged because the fitted slope exceeds the configured decline threshold for this window."
    );
  }
  if (f9.plateau_flag) {
    parts.push(
      "Plateau is detected when recent observations show insufficient movement relative to prior terms."
    );
  }
  if (f9.slope != null) {
    parts.push(`OLS slope: ${f9.slope >= 0 ? "+" : ""}${f9.slope.toFixed(3)} GPA units per day (model overlay).`);
  }

  return (
    <section className="rounded-lg border border-[color:var(--border-default)] bg-surface-inner p-5">
      <h3 className="font-serif text-[16px] text-text-primary">Trajectory summary</h3>
      <p className="mt-2 font-sans text-[14px] leading-relaxed text-text-secondary">
        {parts.join(" ")}
      </p>
    </section>
  );
}

export default TrajectoryDirectionPanel;

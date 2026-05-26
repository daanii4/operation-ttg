"use client";

import * as React from "react";
import AgCompletionPanel from "@/components/ttg/AgCompletionPanel";
import NcaaEligibilityPanel from "@/components/ttg/NcaaEligibilityPanel";
import type { EligibilityBundle } from "@/lib/eligibility/compute-eligibility";

export default function EligibilityPanels({
  studentId,
  targetDivision,
}: {
  studentId: string;
  targetDivision: string;
}) {
  const [data, setData] = React.useState<EligibilityBundle | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/students/${studentId}/eligibility`);
        if (!res.ok) throw new Error("Failed to load eligibility");
        const json = (await res.json()) as EligibilityBundle;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (error) {
    return (
      <p className="font-sans text-[13px] text-band-urgent" role="alert">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <p className="font-mono text-[12px] text-text-tertiary">Loading eligibility…</p>
    );
  }

  return (
    <>
      <div className="mt-6">
        <AgCompletionPanel f1={data.f1} />
      </div>
      <div className="mt-6">
        <NcaaEligibilityPanel
          targetDivision={targetDivision}
          f3={data.f3}
          f4={data.f4}
          f6={data.f6}
          f7={data.f7}
        />
      </div>
    </>
  );
}

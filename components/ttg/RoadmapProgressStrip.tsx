"use client";

import * as React from "react";
import { progressAriaLabel } from "@/lib/roadmap/build-status-ui";

type RoadmapProgressStripProps = {
  version: string;
  live: number;
  partial: number;
  planned: number;
  total: number;
  animate?: boolean;
};

export function RoadmapProgressStrip({
  version,
  live,
  partial,
  planned,
  total,
  animate = true,
}: RoadmapProgressStripProps) {
  const [mounted, setMounted] = React.useState(false);
  const reduceMotion = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  React.useEffect(() => {
    if (reduceMotion) {
      setMounted(true);
      return;
    }
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [reduceMotion]);

  if (total === 0) {
    return (
      <p className="font-mono text-[11px] text-text-tertiary">Capabilities being defined</p>
    );
  }

  const livePct = (live / total) * 100;
  const partialPct = (partial / total) * 100;
  const plannedPct = (planned / total) * 100;
  const scale = animate && !reduceMotion && mounted ? 1 : animate && !reduceMotion ? 0 : 1;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={progressAriaLabel(version, live, partial, planned, total)}
        className="flex h-2 w-full overflow-hidden rounded-full bg-surface-inner"
      >
        {live > 0 ? (
          <div
            className="h-full bg-band-track"
            style={{
              width: `${livePct * scale}%`,
              transition:
                animate && !reduceMotion
                  ? `width var(--duration-slow) var(--ease-out)`
                  : undefined,
            }}
          />
        ) : null}
        {partial > 0 ? (
          <div
            className="h-full bg-band-support"
            style={{
              width: `${partialPct * scale}%`,
              transition:
                animate && !reduceMotion
                  ? `width var(--duration-slow) var(--ease-out)`
                  : undefined,
            }}
          />
        ) : null}
        {planned > 0 ? (
          <div
            className="h-full bg-surface-inner"
            style={{
              width: `${plannedPct * scale}%`,
              borderLeft: partial > 0 || live > 0 ? "1px solid var(--border-default)" : undefined,
            }}
          />
        ) : null}
      </div>
      <p className="font-mono text-[11px] text-text-tertiary">
        {live}/{total} live
      </p>
    </div>
  );
}

export default RoadmapProgressStrip;

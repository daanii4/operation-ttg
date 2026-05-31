"use client";

import * as React from "react";
import type { ProductRoadmapSnapshot, RoadmapPhaseStatus } from "@/lib/roadmap/types";
import { ROADMAP_STATUS_CAPTION, phaseStatusIcon } from "@/lib/roadmap/build-status-ui";
import RoadmapVersionCard, {
  RoadmapVersionCardSkeleton,
  type RoadmapVersion,
} from "@/components/ttg/RoadmapVersionCard";
import {
  RoadmapAllShippedCard,
  RoadmapNextFocusCard,
} from "@/components/ttg/RoadmapNextFocusCard";

const STAGGER_MS = 60;
const MAX_STAGGER_PHASES = 4;

export type RoadmapPageClientProps = {
  summary: string;
  generatedAt: string;
  next: ProductRoadmapSnapshot["next"];
  versions: RoadmapVersion[];
  showInternalDetails: boolean;
};

function lastLivePhaseIndex(versions: RoadmapVersion[]): number {
  let idx = -1;
  versions.forEach((v, i) => {
    if (v.status === "LIVE") idx = i;
  });
  return idx;
}

function timelineNodeFilled(status: RoadmapPhaseStatus): boolean {
  return status === "LIVE" || status === "IN_BUILD";
}

export default function RoadmapPageClient({
  summary,
  generatedAt,
  next,
  versions,
  showInternalDetails,
}: RoadmapPageClientProps) {
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduceMotion(mq.matches);
      if (mq.matches) setRevealed(true);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    if (reduceMotion) return;
    const t = window.setTimeout(() => setRevealed(true), 16);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  const lastLiveIdx = lastLivePhaseIndex(versions);
  const railFillPercent =
    versions.length <= 1
      ? lastLiveIdx >= 0
        ? 100
        : 0
      : lastLiveIdx >= 0
        ? ((lastLiveIdx + 0.5) / versions.length) * 100
        : 0;

  const generatedLabel = new Date(generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-[1080px] space-y-8 px-4 py-8 mobile:px-4 md:px-6">
      <header className="space-y-2">
        <h1 className="font-serif text-[28px] leading-tight text-text-primary">Product Roadmap</h1>
        <p className="font-sans text-[14px] text-text-secondary">{summary}</p>
        <p className="font-mono text-[11px] text-text-tertiary">as of {generatedLabel}</p>
        <p className="font-sans text-[12px] text-text-tertiary">{ROADMAP_STATUS_CAPTION}</p>
      </header>

      {showInternalDetails ? (
        next ? <RoadmapNextFocusCard next={next} /> : <RoadmapAllShippedCard />
      ) : null}

      <section aria-label="Phase timeline">
        <div className="relative md:pl-10">
          <div
            className="pointer-events-none absolute bottom-0 left-[11px] top-0 hidden w-[2px] md:block"
            aria-hidden
          >
            <div className="absolute inset-0 bg-[color:var(--border-default)]" />
            <div
              className="absolute left-0 top-0 w-full bg-olive-600"
              style={{ height: `${railFillPercent}%` }}
            />
          </div>

          <ol className="flex flex-col gap-8">
            {versions.map((v, index) => {
              const delay = reduceMotion
                ? 0
                : Math.min(index, MAX_STAGGER_PHASES - 1) * STAGGER_MS;
              const NodeIcon = phaseStatusIcon(v.status);
              const showNode = timelineNodeFilled(v.status);

              return (
                <li
                  key={v.version}
                  className="relative list-none"
                  style={
                    reduceMotion
                      ? undefined
                      : {
                          opacity: revealed ? 1 : 0,
                          transform: revealed ? "translateY(0)" : "translateY(8px)",
                          transition: `opacity var(--duration-normal) var(--ease-out) ${delay}ms, transform var(--duration-normal) var(--ease-out) ${delay}ms`,
                        }
                  }
                >
                  <div
                    className="absolute -left-0 top-6 hidden h-6 w-6 items-center justify-center md:-left-10 md:flex"
                    aria-hidden
                  >
                    <span
                      className={[
                        "flex h-6 w-6 items-center justify-center rounded-full border-2",
                        showNode
                          ? "border-olive-600 bg-olive-600 text-white"
                          : "border-[color:var(--border-default)] bg-surface-card text-text-tertiary",
                      ].join(" ")}
                    >
                      <NodeIcon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </div>

                  <RoadmapVersionCard v={v} animateProgress={revealed && !reduceMotion} />
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}

export function RoadmapPageLoading() {
  return (
    <div className="mx-auto max-w-[1080px] space-y-8 px-4 py-8 md:px-6">
      <div className="h-8 w-64 animate-pulse rounded bg-surface-inner" />
      <div className="h-40 animate-pulse rounded-xl bg-surface-inner" />
      <div className="flex flex-col gap-8">
        <RoadmapVersionCardSkeleton />
        <RoadmapVersionCardSkeleton />
        <RoadmapVersionCardSkeleton />
      </div>
    </div>
  );
}

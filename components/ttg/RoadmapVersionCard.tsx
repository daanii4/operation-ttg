"use client";

import { AlertTriangle } from "lucide-react";
import Link from "@/components/ui/Link";
import { RoadmapBuildStatusBadge } from "@/components/ttg/RoadmapBuildStatusBadge";
import { RoadmapProgressStrip } from "@/components/ttg/RoadmapProgressStrip";
import {
  ITEM_BUILD_LABEL,
  PHASE_BUILD_LABEL,
  itemDotColor,
  phaseAccentColor,
  phaseStatusBand,
  phaseStatusIcon,
} from "@/lib/roadmap/build-status-ui";
import type { RoadmapItemStatus, RoadmapPhaseStatus } from "@/lib/roadmap/types";

export type RoadmapShipItem = {
  id: string;
  label: string;
  detail: string;
  status: RoadmapItemStatus;
};

export type RoadmapVersion = {
  version: string;
  period: string;
  status: RoadmapPhaseStatus;
  statusBand: import("@/components/ui/Badge").BandKey;
  headline: string;
  description: string;
  ships: RoadmapShipItem[];
  blockers: string[];
  sources: { label: string; url: string }[];
  progress?: {
    live: number;
    partial: number;
    planned: number;
    total: number;
  };
};

type RoadmapVersionCardProps = {
  v: RoadmapVersion;
  animateProgress?: boolean;
  className?: string;
};

export function RoadmapVersionCard({
  v,
  animateProgress = true,
  className = "",
}: RoadmapVersionCardProps) {
  const StatusIcon = phaseStatusIcon(v.status);
  const isHorizon = v.status === "HORIZON";
  const isInBuild = v.status === "IN_BUILD";
  const band = phaseStatusBand(v.status);

  return (
    <article
      className={[
        "rounded-lg border border-[color:var(--border-default)] bg-surface-card p-5",
        "border-l-[3px]",
        isInBuild ? "shadow-md" : "shadow-sm",
        isHorizon ? "opacity-90" : "",
        className,
      ].join(" ")}
      style={{ borderLeftColor: phaseAccentColor(v.status) }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-[20px] leading-none text-text-primary">{v.version}</h2>
          <p className="mt-1 font-mono text-[12px] text-text-tertiary">{v.period}</p>
        </div>
        <RoadmapBuildStatusBadge
          band={band}
          label={PHASE_BUILD_LABEL[v.status]}
          icon={StatusIcon}
          size="md"
        />
      </header>

      {v.progress && v.progress.total > 0 ? (
        <div className="mt-4">
          <RoadmapProgressStrip
            version={v.version}
            live={v.progress.live}
            partial={v.progress.partial}
            planned={v.progress.planned}
            total={v.progress.total}
            animate={animateProgress}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <p className="font-sans text-[14px] font-semibold leading-snug text-text-primary">
          {v.headline}
        </p>
        <p className="font-sans text-[13px] leading-[1.55] text-text-secondary">{v.description}</p>
      </div>

      <div className="mt-5">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          What ships
        </p>
        {v.ships.length === 0 ? (
          <p className="mt-2 font-sans text-[13px] text-text-tertiary">
            Capabilities being defined
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {v.ships.map((item) => (
              <li key={item.id} className="flex flex-col gap-0.5">
                <div className="flex min-h-[44px] items-start gap-2 py-1">
                  <span
                    className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: itemDotColor(item.status) }}
                    aria-hidden
                  />
                  <div className="flex-1">
                    <span className="font-sans text-[13px] text-text-primary">{item.label}</span>
                    <span className="ml-2 font-sans text-[11px] font-medium text-text-tertiary">
                      {ITEM_BUILD_LABEL[item.status]}
                    </span>
                    <p className="mt-0.5 font-sans text-[12px] leading-[1.45] text-text-tertiary">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {v.blockers.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[color:var(--border-default)] bg-surface-inner p-3">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
            Blockers
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {v.blockers.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-band-support"
                  aria-hidden
                />
                <span className="font-sans text-[12px] leading-[1.5] text-text-secondary">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {v.sources.length > 0 ? (
        <div className="mt-4 border-t border-[color:var(--border-default)] pt-3">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
            Grounded in:
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {v.sources.map((s) => (
              <li key={s.url + s.label}>
                <Link href={s.url} external className="text-[12px] text-gold-600">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function RoadmapVersionCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg border border-[color:var(--border-default)] bg-surface-card p-5"
      aria-hidden
    >
      <div className="h-6 w-16 rounded bg-surface-inner" />
      <div className="mt-4 h-2 w-full rounded-full bg-surface-inner" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="h-4 w-full rounded bg-surface-inner" />
        <div className="h-4 w-4/5 rounded bg-surface-inner" />
        <div className="h-4 w-3/5 rounded bg-surface-inner" />
      </div>
    </div>
  );
}

export default RoadmapVersionCard;

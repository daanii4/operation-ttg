import * as React from "react";
import {
  CheckCircle,
  Circle,
  GitBranch,
  Hammer,
  Telescope,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge, { BandKey } from "@/components/ui/Badge";
import Link from "@/components/ui/Link";
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
  statusBand: BandKey;
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

function phaseStatusIcon(status: RoadmapPhaseStatus) {
  switch (status) {
    case "LIVE":
      return CheckCircle;
    case "IN_BUILD":
      return Hammer;
    case "HORIZON":
      return Telescope;
    default:
      return GitBranch;
  }
}

const ITEM_STATUS_LABEL: Record<RoadmapItemStatus, string> = {
  live: "Live",
  partial: "Partial",
  planned: "Planned",
};

const ITEM_DOT: Record<RoadmapItemStatus, string> = {
  live: "var(--band-track)",
  partial: "var(--band-support)",
  planned: "var(--text-tertiary)",
};

export function RoadmapVersionCard({ v }: { v: RoadmapVersion }) {
  const StatusIcon = phaseStatusIcon(v.status);

  return (
    <Card variant="default" padding="lg" className="flex h-full flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0">
          <span className="font-mono text-[22px] font-medium leading-none text-gold-500">
            {v.version}
          </span>
          <span className="mt-1 font-sans text-[12px] text-text-tertiary">
            {v.period}
          </span>
        </div>
        <Badge band={v.statusBand} size="md" icon={StatusIcon}>
          {v.status === "IN_BUILD" ? "IN BUILD" : v.status}
        </Badge>
      </div>

      {v.progress && v.progress.total > 0 ? (
        <p className="font-mono text-[11px] text-text-tertiary">
          {v.progress.live} live · {v.progress.partial} partial · {v.progress.planned}{" "}
          planned
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <h3 className="font-serif text-[18px] leading-[1.25] text-text-primary">
          {v.headline}
        </h3>
        <p className="font-sans text-[13px] leading-[1.55] text-text-secondary">
          {v.description}
        </p>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Capabilities
        </div>
        <ul className="flex flex-col gap-2">
          {v.ships.map((item) => (
            <li key={item.id} className="flex flex-col gap-0.5">
              <div
                className="flex items-start gap-2 font-sans text-[13px] leading-[1.5] text-text-secondary"
              >
                <span
                  className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: ITEM_DOT[item.status] }}
                  aria-hidden
                />
                <span className="flex-1">
                  <span className="text-text-primary">{item.label}</span>
                  <span className="ml-2 font-mono text-[10px] uppercase text-text-tertiary">
                    {ITEM_STATUS_LABEL[item.status]}
                  </span>
                </span>
              </div>
              {item.status !== "live" ? (
                <p className="ml-3.5 font-sans text-[12px] leading-[1.45] text-text-tertiary">
                  {item.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {v.blockers.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-band-urgent">
            Active blockers
          </div>
          <ul className="flex flex-col gap-1.5">
            {v.blockers.map((b) => (
              <li
                key={b}
                className="flex gap-2 font-sans text-[12px] leading-[1.45] text-text-secondary"
              >
                <Circle className="mt-0.5 h-3 w-3 shrink-0 text-band-urgent" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {v.sources.length > 0 ? (
        <div className="mt-auto border-t border-[color:var(--border-default)] pt-3">
          <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
            Source authority
          </div>
          <ul className="mt-1.5 flex flex-col gap-1">
            {v.sources.map((s) => (
              <li key={s.url + s.label}>
                <Link href={s.url} external subtle className="text-[12px]">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

export default RoadmapVersionCard;

import * as React from "react";
import { CheckCircle, GitBranch } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge, { BandKey } from "@/components/ui/Badge";
import Link from "@/components/ui/Link";

export type RoadmapVersion = {
  version: string;
  period: string;
  status: "LIVE" | "PLANNED";
  statusBand: BandKey;
  headline: string;
  description: string;
  ships: string[];
  sources: { label: string; url: string }[];
};

export function RoadmapVersionCard({ v }: { v: RoadmapVersion }) {
  return (
    <Card variant="default" padding="lg" className="flex h-full flex-col gap-4">
      {/* Top row */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0">
          <span className="font-mono text-[22px] font-medium leading-none text-gold-500">
            {v.version}
          </span>
          <span className="mt-1 font-sans text-[12px] text-text-tertiary">
            {v.period}
          </span>
        </div>
        <Badge
          band={v.statusBand}
          size="md"
          icon={v.status === "LIVE" ? CheckCircle : GitBranch}
        >
          {v.status}
        </Badge>
      </div>

      {/* Headline + description */}
      <div className="flex flex-col gap-3">
        <h3 className="font-serif text-[18px] leading-[1.25] text-text-primary">
          {v.headline}
        </h3>
        <p className="font-sans text-[13px] leading-[1.55] text-text-secondary">
          {v.description}
        </p>
      </div>

      {/* What ships */}
      <div className="mt-2 flex flex-col gap-2">
        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          What ships
        </div>
        <ul className="flex flex-col gap-1.5">
          {v.ships.map((item, i) => (
            <li
              key={i}
              className="font-sans text-[13px] leading-[1.5] text-text-secondary"
              style={{ textIndent: "-16px", paddingLeft: "16px" }}
            >
              <span
                className="mr-2 inline-block h-1 w-1 rounded-full align-middle"
                style={{ background: "var(--gold-500)" }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Sources */}
      <div className="mt-auto border-t border-[color:var(--border-default)] pt-3">
        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Source authority
        </div>
        <ul className="mt-1.5 flex flex-col gap-1">
          {v.sources.map((s) => (
            <li key={s.url}>
              <Link href={s.url} external subtle className="text-[12px]">
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default RoadmapVersionCard;

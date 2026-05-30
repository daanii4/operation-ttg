"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, GitBranch } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { PeriodToggle } from "./PeriodToggle";
import {
  buildCompletionPaceModel,
  type PaceCourseInput,
  type PacePeriod,
} from "@/lib/trajectory/build-completion-pace-series";
import type { F5Result } from "@/lib/calculations/f5";
import { deserializeF5, type SerializedF5 } from "@/lib/trajectory/serialize-f5";
import type { SerializedF5Course } from "@/app/dashboard/briefings/_components/use-briefing-data";

const Chart = dynamic(() => import("./CompletionPaceChart"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="h-[240px] w-full animate-pulse rounded-md bg-surface-inner"
    />
  ),
});

export interface CompletionPaceCardProps {
  f5: SerializedF5 | null | undefined;
  courses: SerializedF5Course[] | null | undefined;
  studentId: string;
  loading?: boolean;
}

function toPaceCourses(rows: SerializedF5Course[]): PaceCourseInput[] {
  return rows.map((c) => ({
    id: c.id,
    courseName: c.courseName,
    gradeLetterNormalized: c.gradeLetterNormalized,
    termEndDate: c.termEndDate,
    ncaaD1Category: c.ncaaD1Category,
    ncaaApproved: c.ncaaApproved,
  }));
}

export function CompletionPaceCard({
  f5,
  courses,
  studentId,
  loading = false,
}: CompletionPaceCardProps) {
  const [period, setPeriod] = React.useState<PacePeriod>("term");
  const [animateBars, setAnimateBars] = React.useState(true);

  React.useEffect(() => {
    setAnimateBars(true);
    const t = window.setTimeout(() => setAnimateBars(false), 300);
    return () => window.clearTimeout(t);
  }, [period]);

  const f5Parsed = f5 ? deserializeF5(f5 as SerializedF5) : null;
  const model = React.useMemo(() => {
    if (!f5Parsed || !courses) return null;
    return buildCompletionPaceModel(toPaceCourses(courses), f5Parsed, period);
  }, [f5Parsed, courses, period]);

  const ariaLabel = model
    ? model.pastLock
      ? `Core completion pace: past lock with ${model.points.at(-1)?.cumulativeTotal ?? 0} of ${model.requiredTotal} cores`
      : model.behindPace
        ? `Core completion pace behind target with ${model.points.at(-1)?.cumulativeTotal ?? 0} of ${model.requiredTotal} cores`
        : `Core completion pace on track with ${model.points.at(-1)?.cumulativeTotal ?? 0} of ${model.requiredTotal} cores`
    : "Core completion pace unavailable";

  if (loading) {
    return (
      <section className="rounded-lg border border-[color:var(--border-default)] bg-surface-card p-5 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-surface-inner" />
        <div className="mt-4 h-[240px] animate-pulse rounded-md bg-surface-inner" />
      </section>
    );
  }

  if (!f5Parsed || !f5Parsed.applicable) {
    return (
      <section className="rounded-lg border border-[color:var(--border-default)] bg-surface-card p-5 shadow-sm">
        <h3 className="font-serif text-[18px] text-text-primary">Core completion pace</h3>
        <p className="mt-4 font-sans text-[13px] text-text-tertiary">
          NCAA 10/7 pace does not apply to this athlete&apos;s division intent.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="completion-pace-heading"
      className="rounded-lg border border-[color:var(--border-default)] bg-surface-card p-5 shadow-sm"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3
            id="completion-pace-heading"
            className="font-serif text-[18px] font-normal leading-snug text-text-primary"
          >
            Core completion pace
          </h3>
          <p className="mt-1 font-sans text-[12px] text-text-tertiary">
            Cores earned vs. pace needed to clear lock
          </p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </header>

      <div className="mt-4">
        {model ? (
          <Chart model={model} ariaLabel={ariaLabel} animateBars={animateBars} />
        ) : (
          <div className="flex h-[240px] items-center justify-center rounded-md bg-surface-inner">
            <p className="font-sans text-[13px] text-text-tertiary">Unable to compute pace.</p>
          </div>
        )}
      </div>

      {model ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {model.showEmsLine ? (
            <span className="font-sans text-[11px] text-text-tertiary">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-gold-600 align-middle" />{" "}
              Total cores
              <span className="mx-2">·</span>
              <span className="inline-block h-0.5 w-4 border-t border-dashed border-gold-500 align-middle" />{" "}
              Eng/Math/Sci subset
            </span>
          ) : null}
          {model.behindPace && !model.pastLock ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--status-urgent)]/30 bg-[var(--status-urgent-tint)] px-2.5 py-1 font-sans text-[12px] font-medium text-[color:var(--status-urgent)]">
              <AlertTriangle size={12} aria-hidden />
              Behind pace
            </span>
          ) : null}
          {model.pastLock ? (
            <Link href={`/students/${studentId}?tab=eligibility`}>
              <Badge band="locked" size="sm" icon={GitBranch}>
                Pivot Required
              </Badge>
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default CompletionPaceCard;

"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle, ChevronRight } from "lucide-react";
import type { CohortStudentRow } from "@/app/api/cohort/route";
import { ActionWindowPill } from "@/components/ui/qn/ActionWindowPill";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";
import {
  bandStatusToken,
  bandTintClass,
  buildApproachingLockQueue,
} from "./lock-deadline-queue";

type Props = {
  students: CohortStudentRow[];
  loading?: boolean;
  className?: string;
};

export function ApproachingLockDeadlines({ students, loading = false, className }: Props) {
  const queue = React.useMemo(() => buildApproachingLockQueue(students), [students]);
  const captionCount = queue.length;

  return (
    <section
      className={[
        "rounded-xl bg-surface-card p-6 shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby="approaching-lock-heading"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2
          id="approaching-lock-heading"
          className="font-serif text-[20px] leading-[1.25] text-text-primary"
        >
          Approaching lock deadlines
        </h2>
        <p className="font-sans text-[12px] text-text-tertiary sm:text-right">
          {captionCount} athlete{captionCount === 1 ? "" : "s"} within 60 days, cores outstanding
        </p>
      </div>

      {loading ? (
        <ul className="flex flex-col gap-0" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="border-b border-[color:var(--border-default)] py-3 last:border-0">
              <div className="skeleton h-14 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      ) : queue.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle className="h-8 w-8 text-status-track" aria-hidden />
          <p className="font-sans text-[14px] text-text-secondary">
            No athletes approaching lock with cores outstanding.
          </p>
          <Link
            href="/dashboard/roster"
            className="font-sans text-[13px] font-medium text-gold-600 underline [text-underline-offset:3px] hover:text-gold-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--olive-600)]"
          >
            View full roster
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col">
          {queue.map((student, index) => (
            <li
              key={student.studentId}
              className={index > 0 ? "border-t border-[color:var(--border-default)]" : undefined}
            >
              <LockDeadlineRow student={student} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LockDeadlineRow({ student }: { student: CohortStudentRow }) {
  const band = student.riskBand;
  const vocab =
    band !== "NOT_APPLICABLE" ? RISK_VOCABULARY[band] : RISK_VOCABULARY.RED;
  const Icon = vocab.icon;
  const spineColor = bandStatusToken(band);
  const weeks =
    student.daysToLock != null ? Math.max(1, Math.ceil(student.daysToLock / 7)) : null;
  const showActionPill = weeks != null && weeks <= 4 && band !== "LOCKED";
  const divisionLabel = student.targetDivision?.replace(/_/g, " ") ?? "D1 Target";
  const coresChip =
    student.missingTotal === 1
      ? "1 core missing"
      : `${student.missingTotal} cores missing`;

  return (
    <Link
      href={`/students/${student.studentId}`}
      className={[
        "group flex items-center gap-3 rounded-lg border-l-4 py-3 pl-3 pr-4 transition-[background,transform,border-width]",
        "border-l-[color:var(--row-spine)] bg-surface-card hover:border-l-[6px] hover:bg-surface-inner",
        "active:scale-[0.99] active:duration-100",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      ].join(" ")}
      style={{
        // @ts-expect-error custom property for spine + focus
        "--row-spine": spineColor,
        outlineColor: spineColor,
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" style={{ color: spineColor }} aria-hidden />
          <div className="min-w-0">
            <span className="os-label block truncate text-text-primary">{vocab.label}</span>
            <p className="mt-0.5 truncate font-serif text-[14px] text-text-primary">
              {student.firstName} {student.lastName}
            </p>
            <p className="mt-0.5 truncate font-sans text-[12px] text-text-secondary">
              Grade {student.grade} · {student.sport} · {divisionLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:justify-end">
          {showActionPill ? <ActionWindowPill weeks={weeks} /> : null}
          {band === "LOCKED" ? (
            <span className="font-mono text-[12px] font-medium text-status-escalated">Past lock</span>
          ) : student.daysToLock != null ? (
            <span className="font-mono text-[14px] font-medium text-text-primary">
              {student.provisionalFlag ? "~" : ""}
              {student.daysToLock}
              <span className="ml-0.5 text-[11px] text-text-tertiary">d</span>
            </span>
          ) : null}
          {band !== "NOT_APPLICABLE" ? (
            <span
              className={[
                "rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium",
                bandTintClass(band),
              ].join(" ")}
            >
              {coresChip}
            </span>
          ) : null}
          <ChevronRight
            className="h-4 w-4 text-text-tertiary transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}

export default ApproachingLockDeadlines;

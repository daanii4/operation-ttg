"use client";
import * as React from "react";
import { CalendarClock, ChevronDown, ChevronUp } from "lucide-react";
import Card from "@/components/ui/Card";
import Link from "@/components/ui/Link";
import type { ApproachingDeadline } from "@/lib/calculations/approaching-deadlines";

type Props = {
  deadlines: ApproachingDeadline[];
  className?: string;
};

export function ApproachingDeadlinesPanel({ deadlines, className }: Props) {
  return (
    <Card variant="default" padding="lg" className={["mt-6", className].filter(Boolean).join(" ")}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
            Approaching Critical Action Deadlines
          </h2>
          <p className="mt-1 font-sans text-[12px] text-text-tertiary">
            Deterministic weeks-to-action from school, intervention, and college eligibility calendars.
          </p>
        </div>
        <CalendarClock className="h-5 w-5 text-text-tertiary" />
      </div>

      {deadlines.length === 0 ? (
        <div className="rounded bg-surface-inner p-6 text-center">
          <p className="font-sans text-[14px] text-text-secondary">
            No urgent administrative deadlines for the current cohort.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deadlines.map((deadline) => (
            <DeadlineRow key={deadline.id} deadline={deadline} />
          ))}
        </div>
      )}
    </Card>
  );
}

function DeadlineRow({ deadline }: { deadline: ApproachingDeadline }) {
  const [listOpen, setListOpen] = React.useState(false);
  const urgencyClass =
    deadline.daysRemaining <= 14
      ? "text-band-red"
      : deadline.daysRemaining <= 30
        ? "text-band-yellow"
        : "text-band-green";

  return (
    <div className="rounded bg-surface-inner p-4">
      <div className="flex items-start justify-between gap-4 mobile:flex-col">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-[16px] leading-tight text-text-primary">
              {deadline.name}
            </h3>
            <span className="rounded-sm border border-gold-500/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-gold-500">
              {deadline.label}
            </span>
          </div>
          <p className="mt-1 font-sans text-[12px] leading-[1.5] text-text-secondary">
            {deadline.description}
          </p>
          <div className="mt-2 font-mono text-[11px] text-text-tertiary">
            {deadline.affectedStudentIds.length} student
            {deadline.affectedStudentIds.length === 1 ? "" : "s"} affected
          </div>
          <div className="mt-2">
            <button
              type="button"
              aria-expanded={listOpen}
              onClick={() => setListOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded font-sans text-[11px] font-medium text-gold-500 underline [text-decoration-thickness:1px] [text-underline-offset:2px] hover:brightness-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--olive-600)] focus-visible:[outline-offset:2px]"
            >
              {listOpen ? "Hide affected students" : "View affected students"}
              {listOpen ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
            {listOpen ? (
              <ul className="mt-2 max-h-[220px] space-y-1 overflow-y-auto rounded border border-[color:var(--border-default)] bg-surface-card p-3">
                {deadline.affectedStudents.map((student) => (
                  <li key={student.studentId}>
                    <Link href={`/students/${student.studentId}`} icon="arrow" className="text-[12px]">
                      {student.firstName} {student.lastName}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="mt-2">
            <Link href={deadline.sourceUrl} external icon="arrow" className="text-[11px]">
              Source: {deadline.sourceLabel}
            </Link>
          </div>
        </div>
        <div className="shrink-0 text-right mobile:text-left">
          <div className={`font-mono text-[28px] font-medium leading-none ${urgencyClass}`}>
            {deadline.daysRemaining}
            <span className="ml-1 text-[12px] text-text-tertiary">days</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-text-tertiary">
            {deadline.weeksRemaining} week{deadline.weeksRemaining === 1 ? "" : "s"} remaining
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApproachingDeadlinesPanel;

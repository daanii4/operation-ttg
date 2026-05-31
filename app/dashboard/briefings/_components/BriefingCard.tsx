"use client";

import * as React from "react";
import { AlertCircle, FileText, Inbox } from "lucide-react";
import type { AdvisorRole } from "@prisma/client";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { Button, SkeletonCard } from "@/components/ui/qn";
import { type UseBriefingResult } from "./use-briefing-data";
import BriefingDetailContent from "./BriefingDetailContent";

export interface BriefingCardProps {
  selected: QnRosterRow | null;
  briefing: UseBriefingResult;
  sessionUserId: string;
  teamRole: AdvisorRole;
  embedded?: boolean;
}

export function BriefingCard({
  selected,
  briefing,
  sessionUserId,
  teamRole,
  embedded = false,
}: BriefingCardProps) {
  if (!selected) return <NoSelection />;

  if (briefing.status === "loading") {
    return <SkeletonCard />;
  }

  if (briefing.status === "error") {
    return <ErrorCard onRetry={briefing.refetch} message={briefing.error} />;
  }

  if (briefing.status === "empty" || !briefing.data?.f12) {
    return <NoBriefingData />;
  }

  const content = (
    <BriefingDetailContent
      selected={selected}
      briefing={briefing}
      sessionUserId={sessionUserId}
      teamRole={teamRole}
      embedded={embedded}
    />
  );

  if (embedded) {
    return <article>{content}</article>;
  }

  return (
    <article
      className="overflow-hidden rounded-lg bg-[var(--surface-card)]"
      style={{ border: "1px solid var(--border-default)" }}
    >
      {content}
    </article>
  );
}

function NoSelection() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{ color: "var(--text-primary)" }}
    >
      <FileText size={40} aria-hidden style={{ color: "var(--text-quaternary)" }} />
      <p className="mt-4 text-base font-semibold">Select a student</p>
      <p className="mt-1 max-w-[360px] text-[13px] leading-5" style={{ color: "var(--text-tertiary)" }}>
        Choose a student from the list to view their briefing.
      </p>
    </div>
  );
}

function NoBriefingData() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{ color: "var(--text-primary)" }}
    >
      <Inbox size={40} aria-hidden style={{ color: "var(--text-quaternary)" }} />
      <p className="mt-4 text-base font-semibold">No briefing available yet</p>
      <p className="mt-1 max-w-[360px] text-[13px] leading-5" style={{ color: "var(--text-tertiary)" }}>
        Eligibility data hasn&apos;t compiled for this student. Briefings refresh nightly.
      </p>
    </div>
  );
}

function ErrorCard({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message: string | null;
}) {
  return (
    <article
      role="alert"
      className="overflow-hidden rounded-lg border border-[var(--border-default)] border-l-[3px] border-l-[var(--color-red)] bg-[var(--surface-card)]"
    >
      <div className="flex gap-3 bg-[var(--color-red-tint)] px-5 py-4">
        <AlertCircle size={20} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-red)]" />
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Couldn&apos;t load briefing</p>
          <p className="mt-0.5 text-[12px] text-[var(--color-red)]">
            {message ?? "Check your connection and try again."}
          </p>
          <div className="mt-3">
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default BriefingCard;

"use client";

/**
 * QuasarNova v1 — §4.3 Briefing card composer (desktop).
 *
 * Owns the card chrome and the four sections (A–D). Handles the four global
 * card states from §4.5: loading, empty (no selection), empty (no data for
 * the selected student), error, and the "insufficient evidence" banner.
 *
 * Mobile renders a simpler stacked layout — see <BriefingMobile> in the page
 * client. The two trees diverge per §7 (do not try to make one component
 * serve both).
 */

import * as React from "react";
import { AlertCircle, FileText, Inbox, Info } from "lucide-react";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { Button, SkeletonCard } from "@/components/ui/qn";
import {
  hasInsufficientEvidence,
  type UseBriefingResult,
} from "./use-briefing-data";
import BriefingHero from "./BriefingHero";
import InterventionCodes from "./InterventionCodes";
import LayerSummary from "./LayerSummary";
import EvidenceFooter from "./EvidenceFooter";
import ExportPDFButton from "./ExportPDFButton";

function relativeFromNow(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const sec = Math.max(1, Math.round(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

export interface BriefingCardProps {
  selected: QnRosterRow | null;
  briefing: UseBriefingResult;
}

export function BriefingCard({ selected, briefing }: BriefingCardProps) {
  if (!selected) return <NoSelection />;

  if (briefing.status === "loading") {
    return <SkeletonCard />;
  }

  if (briefing.status === "error") {
    return <ErrorCard onRetry={briefing.refetch} message={briefing.error} />;
  }

  if (briefing.status === "empty") {
    return <NoBriefingData />;
  }

  const data = briefing.data;
  if (!data || !data.f12) {
    return <NoBriefingData />;
  }

  const insufficient = hasInsufficientEvidence(data);
  const updatedRelative = briefing.computedAt
    ? relativeFromNow(briefing.computedAt)
    : undefined;

  return (
    <article
      className="overflow-hidden rounded-lg bg-white"
      style={{ border: "1px solid var(--color-border)" }}
    >
      <BriefingHero
        student={selected}
        updatedRelative={updatedRelative}
        bandOverride={mapCompositeBandToBand(data.f12.composite_band)}
        weeksOverride={data.f12.weeks_to_critical_action}
        exportButton={
          <ExportPDFButton
            studentId={selected.studentId}
            studentName={selected.fullName}
            filenameHint={`briefing-${selected.firstName}-${selected.lastName}`.toLowerCase()}
          />
        }
      />
      {insufficient ? <InsufficientEvidenceBanner /> : null}
      <InterventionCodes f12={data.f12} />
      <div style={{ borderTop: "1px solid var(--color-border)" }} />
      <LayerSummary payload={data} />
      <EvidenceFooter payload={data} computedAt={briefing.computedAt} />
    </article>
  );
}

import type { Band } from "@/components/ui/qn";
import type { CompositeBand } from "@/lib/calculations/types";

function mapCompositeBandToBand(c: CompositeBand): Band {
  return c;
}

function NoSelection() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: 64, color: "var(--color-text)" }}
    >
      <FileText size={40} aria-hidden style={{ color: "#9CA3AF" }} />
      <p className="text-base font-semibold" style={{ marginTop: 16 }}>
        Select a student
      </p>
      <p
        style={{
          fontSize: 13,
          lineHeight: "20px",
          marginTop: 4,
          color: "var(--color-muted)",
          maxWidth: 360,
        }}
      >
        Choose a student from the list to view their briefing.
      </p>
    </div>
  );
}

function NoBriefingData() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: 64, color: "var(--color-text)" }}
    >
      <Inbox size={40} aria-hidden style={{ color: "#9CA3AF" }} />
      <p className="text-base font-semibold" style={{ marginTop: 16 }}>
        No briefing available yet
      </p>
      <p
        style={{
          fontSize: 13,
          lineHeight: "20px",
          marginTop: 4,
          color: "var(--color-muted)",
          maxWidth: 360,
        }}
      >
        Eligibility data hasn't compiled for this student. Briefings refresh nightly.
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
      className="overflow-hidden rounded-lg"
      style={{
        border: "1px solid var(--color-border)",
        borderLeft: "3px solid var(--color-red)",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          background: "var(--color-red-tint)",
        }}
      >
        <AlertCircle
          size={20}
          aria-hidden
          style={{ color: "var(--color-red)", flexShrink: 0, marginTop: 2 }}
        />
        <div className="flex-1">
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
            Couldn't load briefing
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--color-red)",
              marginTop: 2,
            }}
          >
            {message ?? "Check your connection and try again."}
          </p>
          <div style={{ marginTop: 12 }}>
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function InsufficientEvidenceBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-3"
      style={{
        margin: "0 28px",
        marginTop: 16,
        padding: "12px 16px",
        background: "var(--color-yellow-tint)",
        border: "1px solid #FDE68A",
        borderRadius: 6,
      }}
    >
      <Info size={16} aria-hidden style={{ color: "var(--color-yellow)", flexShrink: 0, marginTop: 2 }} />
      <p style={{ fontSize: 12, fontWeight: 500, color: "#92400E", lineHeight: "16px" }}>
        Some layers don't have enough recent data. Treat values as provisional.
      </p>
    </div>
  );
}

export default BriefingCard;

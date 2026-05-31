"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Hammer,
  HelpCircle,
} from "lucide-react";
import type { RoadmapNextFocus } from "@/lib/roadmap/types";
import {
  nextFocusItemBand,
  nextFocusItemLabel,
  PHASE_BUILD_LABEL,
  phaseStatusBand,
  phaseStatusIcon,
} from "@/lib/roadmap/build-status-ui";
import { RoadmapBuildStatusBadge } from "@/components/ttg/RoadmapBuildStatusBadge";

type RoadmapNextFocusCardProps = {
  next: RoadmapNextFocus;
};

export function RoadmapNextFocusCard({ next }: RoadmapNextFocusCardProps) {
  const PhaseIcon = phaseStatusIcon(next.phaseStatus);
  const itemBand = nextFocusItemBand(next.status);
  const ItemIcon =
    next.status === "live"
      ? CheckCircle
      : next.status === "partial"
        ? Hammer
        : Calendar;

  return (
    <article
      className="rounded-xl border border-[color:var(--border-default)] bg-surface-card p-6 shadow-md"
      style={{ borderTopWidth: 3, borderTopColor: "var(--gold-500)" }}
    >
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
        NEXT ON THE ROADMAP
      </p>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-serif text-[20px] leading-tight text-text-primary">{next.label}</h2>
        <RoadmapBuildStatusBadge
          band={itemBand}
          label={nextFocusItemLabel(next.status)}
          icon={ItemIcon}
          size="md"
        />
      </div>

      <p className="mt-2 font-sans text-[14px] leading-[1.55] text-text-secondary">{next.detail}</p>

      <span className="mt-3 inline-flex rounded-sm border border-[color:var(--border-default)] bg-surface-inner px-2 py-0.5 font-mono text-[11px] text-text-tertiary">
        {next.phaseVersion} · {PHASE_BUILD_LABEL[next.phaseStatus]}
      </span>

      <div className="mt-6 flex flex-col gap-4 border-t border-[color:var(--border-default)] pt-5">
        {next.agentQuestions.length > 0 ? (
          <div>
            <h3 className="font-sans text-[13px] font-semibold text-text-primary">
              To proceed, we need:
            </h3>
            <ul className="mt-2 flex flex-col gap-4">
              {next.agentQuestions.map((q) => (
                <li key={q} className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-gold-600"
                      aria-hidden
                    />
                    <span className="font-sans text-[13px] leading-[1.5] text-text-secondary">
                      {q}
                    </span>
                  </div>
                  <textarea
                    disabled
                    aria-hidden
                    tabIndex={-1}
                    placeholder="Your answer (coming soon)"
                    className="min-h-[44px] w-full resize-none rounded-lg border border-dashed border-[color:var(--border-default)] bg-surface-page px-3 py-2 font-sans text-[13px] text-text-tertiary opacity-60 placeholder:text-text-quaternary"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {next.blockers.length > 0 ? (
          <div>
            <h3 className="font-sans text-[13px] font-semibold text-text-primary">Blockers:</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {next.blockers.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-band-support"
                    aria-hidden
                  />
                  <span className="font-sans text-[13px] leading-[1.5] text-text-secondary">
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {next.agentQuestions.length === 0 && next.blockers.length === 0 ? (
          <p className="flex items-center gap-2 font-sans text-[13px] text-band-track">
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
            Scope confirmed — ready to build
          </p>
        ) : null}
      </div>

    </article>
  );
}

export function RoadmapAllShippedCard() {
  return (
    <article
      className="rounded-xl border border-[color:var(--border-default)] bg-surface-card p-6 shadow-md"
      style={{ borderTopWidth: 3, borderTopColor: "var(--gold-500)" }}
    >
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
        NEXT ON THE ROADMAP
      </p>
      <p className="mt-3 flex items-start gap-2 font-serif text-[20px] leading-snug text-text-primary">
        <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-band-track" aria-hidden />
        Everything on the current roadmap is live. Next phase planning is open.
      </p>
    </article>
  );
}

export default RoadmapNextFocusCard;

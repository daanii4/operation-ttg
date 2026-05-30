"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import Badge, { type BandKey } from "@/components/ui/Badge";
import { EvidenceTierChip, Skeleton, type EvidenceTier } from "@/components/ui/qn";
import { DerivationModal } from "@/components/ttg/DerivationModal";
import { DerivationTrigger } from "@/components/ttg/DerivationTrigger";
import { ProvisionalAlert } from "@/components/ttg/ProvisionalAlert";
import { RISK_VOCABULARY } from "@/components/ttg/risk-vocabulary";
import type { FrameworkVerdict } from "@/lib/eligibility/framework-verdict";
import type { AuthorityCitation } from "@/lib/config/ncaa-authority";

export interface SubjectRow {
  key: string;
  label: string;
  completed: number;
  required: number;
  satisfied: boolean;
  insufficient?: boolean;
  derivationTitle: string;
  derivationBody: string;
}

export interface CompletionCardProps {
  title: string;
  subtitle?: string;
  rows: SubjectRow[];
  verdict: FrameworkVerdict | null;
  loading?: boolean;
  /** Flat section inside profile shell — no outer card chrome. */
  embedded?: boolean;
}

const BAND_KEY: Record<string, BandKey> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  LOCKED: "locked",
};

type DerivationState = {
  title: string;
  body: string;
  evidenceTier: EvidenceTier;
  source: AuthorityCitation;
};

export function CompletionCard({
  title,
  subtitle,
  rows,
  verdict,
  loading = false,
  embedded = false,
}: CompletionCardProps) {
  const [derivation, setDerivation] = React.useState<DerivationState | null>(null);
  const shellClass = embedded
    ? "p-6"
    : "rounded-lg border border-[color:var(--border-default)] bg-surface-card p-6 shadow-sm";
  const headingId = `completion-${title.toLowerCase().replace(/\W+/g, "-")}-heading`;

  const openDerivation = (d: DerivationState) => setDerivation(d);

  if (loading) {
    return (
      <section
        aria-labelledby={headingId}
        className={shellClass}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-28 rounded-full" />
        </header>
        <ul className="mt-4 flex flex-col" role="list">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="flex min-h-[36px] items-center border-b border-[color:var(--border-default)] py-2 last:border-b-0"
            >
              <Skeleton className="h-4 w-full" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (verdict?.notApplicable) {
    return (
      <section
        aria-labelledby={headingId}
        className={shellClass}
      >
        <header>
          <h3
            id={headingId}
            className="font-serif text-[18px] font-normal leading-snug text-text-primary"
          >
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 font-sans text-[12px] text-text-tertiary">{subtitle}</p>
          ) : null}
        </header>
        <div className="mt-6 flex items-start gap-2 text-text-secondary">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p className="font-sans text-[13px] leading-relaxed">
            Not applicable for this athlete&apos;s declared division.
          </p>
        </div>
      </section>
    );
  }

  const band = verdict?.band;
  const vocab = band ? RISK_VOCABULARY[band] : null;

  return (
    <>
      <section
        aria-labelledby={headingId}
        className={shellClass}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              id={headingId}
              className="font-serif text-[18px] font-normal leading-snug text-text-primary"
            >
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 font-sans text-[12px] text-text-tertiary">{subtitle}</p>
            ) : null}
          </div>
          {vocab && band ? (
            <DerivationTrigger
              ariaLabel={`View derivation for ${vocab.label} verdict`}
              onClick={() =>
                verdict &&
                openDerivation({
                  title: verdict.verdictTitle,
                  body: verdict.verdictBody,
                  evidenceTier: verdict.chipTier,
                  source: verdict.source,
                })
              }
            >
              <Badge band={BAND_KEY[band]} size="sm" icon={vocab.icon}>
                {vocab.label}
              </Badge>
            </DerivationTrigger>
          ) : verdict?.insufficient ? (
            <EvidenceTierChip tier="Insufficient" />
          ) : null}
        </header>

        {verdict?.provisional && verdict.provisionalReason ? (
          <div className="mt-4">
            <ProvisionalAlert reason={verdict.provisionalReason} />
          </div>
        ) : null}

        <ul role="list" className="mt-4 flex flex-col">
          {rows.map((row) => (
            <CompletionRow
              key={row.key}
              row={row}
              provisional={verdict?.provisional ?? false}
              chipTier={verdict?.chipTier ?? "Insufficient"}
              source={verdict?.source}
              onOpenDerivation={openDerivation}
            />
          ))}
        </ul>

        {verdict ? (
          <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border-default)] pt-4">
            <a
              href={verdict.source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-[12px] font-medium text-gold-600 underline decoration-gold-600/40 underline-offset-[3px] hover:text-gold-500"
            >
              Source: {verdict.source.sourceLabel}
            </a>
            <EvidenceTierChip tier={verdict.chipTier} />
          </footer>
        ) : null}
      </section>

      {derivation ? (
        <DerivationModal
          open
          onClose={() => setDerivation(null)}
          title={derivation.title}
          body={derivation.body}
          evidenceTier={derivation.evidenceTier}
          sourceUrl={derivation.source.sourceUrl}
          sourceLabel={derivation.source.sourceLabel}
          sourceAuthority={derivation.source.sourceAuthority}
        />
      ) : null}
    </>
  );
}

function CompletionRow({
  row,
  provisional,
  chipTier,
  source,
  onOpenDerivation,
}: {
  row: SubjectRow;
  provisional: boolean;
  chipTier: EvidenceTier;
  source?: AuthorityCitation;
  onOpenDerivation: (d: DerivationState) => void;
}) {
  const insufficient = row.insufficient;
  const failed = !insufficient && !row.satisfied;

  return (
    <li className="flex min-h-[36px] items-center justify-between gap-3 border-b border-[color:var(--border-default)] py-2 last:border-b-0">
      <span className="min-w-0 flex-1 font-sans text-[13px] text-text-primary">{row.label}</span>
      <div className="flex shrink-0 items-center gap-2">
        {insufficient ? (
          <span
            className="font-mono text-[13px] text-text-tertiary"
            title="Insufficient evidence"
          >
            —
          </span>
        ) : (
          <DerivationTrigger
            ariaLabel={`View derivation for ${row.label}`}
            onClick={() =>
              source &&
              onOpenDerivation({
                title: row.derivationTitle,
                body: row.derivationBody,
                evidenceTier: chipTier,
                source,
              })
            }
            className="inline-flex items-center gap-1.5"
          >
            <span
              className={[
                "font-mono text-[13px] font-medium",
                failed ? "text-band-urgent" : "text-text-primary",
              ].join(" ")}
            >
              {provisional ? "~" : ""}
              {row.completed.toFixed(1)} / {row.required.toFixed(1)} yrs
            </span>
            {failed ? (
              <AlertTriangle size={14} className="text-band-urgent" aria-hidden />
            ) : (
              <CheckCircle size={14} className="text-band-track" aria-hidden />
            )}
          </DerivationTrigger>
        )}
      </div>
    </li>
  );
}

export default CompletionCard;

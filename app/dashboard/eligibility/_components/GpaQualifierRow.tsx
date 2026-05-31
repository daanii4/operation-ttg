"use client";

import * as React from "react";
import type { F4Result } from "@/lib/calculations/f4";
import type { F7Result } from "@/lib/calculations/f7";
import Badge from "@/components/ui/Badge";
import { EvidenceTierChip, Skeleton, type EvidenceTier } from "@/components/ui/qn";
import { DerivationModal } from "@/components/ttg/DerivationModal";
import { DerivationTrigger } from "@/components/ttg/DerivationTrigger";
import { ProvisionalAlert } from "@/components/ttg/ProvisionalAlert";
import {
  qualifierVocabularyFor,
  type QualifierVocabulary,
} from "@/components/ttg/qualifier-vocabulary";
import {
  gpaDerivationFromF4,
  gpaDerivationFromF7,
  toChipTier,
} from "@/lib/eligibility/framework-verdict";
import { NCAA_BYLAW_14_3 } from "@/lib/config/ncaa-authority";

export interface GpaQualifierRowProps {
  f4?: F4Result | null | undefined;
  f7?: F7Result | null | undefined;
  showD1?: boolean;
  showD2?: boolean;
  loading?: boolean;
}

type DerivationState = {
  title: string;
  body: string;
  evidenceTier: EvidenceTier;
};

export function GpaQualifierRow({
  f4,
  f7,
  showD1 = true,
  showD2 = true,
  loading = false,
}: GpaQualifierRowProps) {
  const [derivation, setDerivation] = React.useState<DerivationState | null>(null);

  if (loading) {
    return (
      <section
        aria-labelledby="gpa-qualifier-heading"
        className="rounded-lg border border-[color:var(--border-default)] bg-surface-inner p-4"
      >
        <Skeleton className="mb-4 h-4 w-48" />
        <div className="flex justify-between gap-4">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-10 w-24" />
        </div>
      </section>
    );
  }

  const cells: React.ReactNode[] = [];
  if (showD1) {
    cells.push(
      <QualifierCell
        key="d1"
        division="D1"
        f4={f4}
        onOpen={(d) => setDerivation(d)}
      />
    );
  }
  if (showD2) {
    cells.push(
      <QualifierCell
        key="d2"
        division="D2"
        f7={f7}
        onOpen={(d) => setDerivation(d)}
      />
    );
  }

  if (cells.length === 0) return null;

  return (
    <>
      <section
        aria-labelledby="gpa-qualifier-heading"
        className="rounded-lg border border-[color:var(--border-default)] bg-surface-inner p-4"
      >
        <h3
          id="gpa-qualifier-heading"
          className="sr-only"
        >
          NCAA Core GPA Qualifier
        </h3>
        <div
          className={[
            "flex flex-col gap-4",
            cells.length > 1 ? "md:flex-row md:items-center md:justify-between md:gap-6" : "",
          ].join(" ")}
        >
          {cells}
        </div>
      </section>

      {derivation ? (
        <DerivationModal
          open
          onClose={() => setDerivation(null)}
          title={derivation.title}
          body={derivation.body}
          evidenceTier={derivation.evidenceTier}
          sourceUrl={NCAA_BYLAW_14_3.sourceUrl}
          sourceLabel={NCAA_BYLAW_14_3.sourceLabel}
          sourceAuthority={NCAA_BYLAW_14_3.sourceAuthority}
        />
      ) : null}
    </>
  );
}

function QualifierCell({
  division,
  f4,
  f7,
  onOpen,
}: {
  division: "D1" | "D2";
  f4?: F4Result | null;
  f7?: F7Result | null;
  onOpen: (d: DerivationState) => void;
}) {
  const result = division === "D1" ? f4 : f7;
  const derivation = division === "D1" ? gpaDerivationFromF4(f4) : gpaDerivationFromF7(f7);
  const vocab = qualifierVocabularyFor(result?.qualifierStatus);
  const chipTier: EvidenceTier = result
    ? toChipTier(result.evidenceTier)
    : "Insufficient";
  const insufficient =
    !result ||
    result.evidenceTier === "Insufficient" ||
    (!result.applicable && division === "D1" && f4?.applicable === false);
  const excluded =
    division === "D1"
      ? f4?.coresExcludedBeyond16 ?? []
      : f7?.coresExcludedBeyond16 ?? [];
  const gpa = result?.coreGpaWeighted ?? null;
  const provisional = result?.qualifierStatusProvisional ?? false;

  const gpaColor = vocab
    ? vocab.band === "green"
      ? "text-band-track"
      : vocab.band === "yellow"
        ? "text-band-support"
        : "text-band-urgent"
    : "text-text-tertiary";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="font-sans text-[12px] text-text-tertiary">
          NCAA Core GPA ({division})
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {vocab && !insufficient ? (
            <DerivationTrigger
              ariaLabel={`View derivation for ${vocab.label}`}
              onClick={() =>
                derivation &&
                onOpen({
                  title: derivation.title,
                  body: derivation.body,
                  evidenceTier: derivation.chipTier,
                })
              }
            >
              <Badge band={vocab.band} size="sm" icon={vocab.icon}>
                {vocab.label}
              </Badge>
            </DerivationTrigger>
          ) : (
            <EvidenceTierChip tier="Insufficient" />
          )}
          {provisional ? <EvidenceTierChip tier="Provisional" /> : null}
        </div>
        {provisional && result && !result.applicable ? null : provisional ? (
          <div className="mt-2">
            <ProvisionalAlert reason="Core GPA uses course data pending full NCAA classification verification." />
          </div>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        {insufficient ? (
          <>
            <span className="font-mono text-[24px] font-medium text-text-tertiary">—</span>
            <p className="mt-1 font-sans text-[11px] text-text-tertiary">
              Insufficient grade data
            </p>
          </>
        ) : (
          <DerivationTrigger
            ariaLabel={`View derivation for ${division} core GPA`}
            onClick={() =>
              derivation &&
              onOpen({
                title: derivation.title,
                body: derivation.body,
                evidenceTier: derivation.chipTier,
              })
            }
          >
            <span className={`font-mono text-[24px] font-medium leading-none ${gpaColor}`}>
              {provisional ? "~" : ""}
              {gpa != null ? gpa.toFixed(2) : "—"}
            </span>
          </DerivationTrigger>
        )}

        {excluded.length > 0 ? (
          <Best16Disclosure courses={excluded} />
        ) : null}
      </div>
    </div>
  );
}

function Best16Disclosure({ courses }: { courses: string[] }) {
  return (
    <details
      className="mt-2 text-left"
      open={courses.length > 0}
    >
      <summary className="cursor-pointer font-mono text-[11px] font-medium text-olive-600 underline decoration-olive-600/30 underline-offset-2 hover:text-olive-700">
        Best-16 selection
      </summary>
      <ul className="mt-2 max-h-32 overflow-y-auto font-mono text-[11px] text-text-tertiary">
        {courses.map((c) => (
          <li key={c} className="truncate">
            {c}
          </li>
        ))}
      </ul>
    </details>
  );
}

export default GpaQualifierRow;

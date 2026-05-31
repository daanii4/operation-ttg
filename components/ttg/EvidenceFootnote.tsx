import * as React from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";

export type EvidenceFootnoteProps = {
  text: string;
  sourceUrl: string;
  sourceLabel: string;
  /** @deprecated Tier is shown on framework cards; footnote is citation-only. */
  evidenceTier?: "Deterministic" | "Provisional";
};

export function EvidenceFootnote({ text, sourceUrl, sourceLabel }: EvidenceFootnoteProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-surface-inner p-4 text-text-tertiary">
      <ShieldCheck
        size={16}
        className="mt-0.5 shrink-0 text-olive-600"
        aria-hidden
      />
      <p className="font-sans text-[12px] leading-relaxed text-text-tertiary">
        {text}{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-gold-600 underline decoration-gold-600/40 underline-offset-[3px] hover:text-gold-500"
        >
          {sourceLabel}
          <ExternalLink size={12} aria-hidden />
        </a>
      </p>
    </div>
  );
}

export default EvidenceFootnote;

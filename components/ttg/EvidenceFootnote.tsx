import * as React from "react";
import { Info } from "lucide-react";
import Card from "@/components/ui/Card";
import Link from "@/components/ui/Link";

type EvidenceFootnoteProps = {
  evidenceTier: "Deterministic" | "Provisional";
  text: string;
  sourceUrl: string;
  sourceLabel: string;
};

export function EvidenceFootnote({
  evidenceTier,
  text,
  sourceUrl,
  sourceLabel,
}: EvidenceFootnoteProps) {
  const tierColor =
    evidenceTier === "Deterministic" ? "text-band-green" : "text-band-yellow";
  return (
    <Card variant="inner" padding="md" className="rounded">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-[14px] w-[14px] shrink-0 text-text-tertiary" />
        <div className="flex flex-col gap-0">
          <div className="font-mono text-[11px] text-text-tertiary">
            Evidence tier: <span className={tierColor}>{evidenceTier}</span>
          </div>
          <div className="font-mono text-[11px] leading-[1.6] text-text-tertiary">
            {text}{" "}
            <Link href={sourceUrl} external className="text-[11px]">
              {sourceLabel}
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default EvidenceFootnote;

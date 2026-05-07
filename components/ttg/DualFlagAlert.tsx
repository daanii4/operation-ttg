import * as React from "react";
import { AlertOctagon } from "lucide-react";
import Card from "@/components/ui/Card";
import { translateDualFlagAction } from "@/lib/translate/dual-flag-action";

type Flag = {
  courseName: string;
  ncaaStatus: string;
  agStatus: string;
  recommendedAction: string;
};

export function DualFlagAlert({ flags }: { flags: Flag[] }) {
  return (
    <Card variant="alert-red" padding="lg" className="rounded">
      <div className="mb-3 flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-escalation" />
        <h2 className="font-sans text-[14px] font-bold uppercase tracking-[0.06em] text-escalation">
          A-G / NCAA Dual Flag
        </h2>
      </div>
      <p className="mb-4 font-sans text-[12px] text-text-secondary">
        These courses are flagged in both UC A-G and NCAA frameworks. Resolution required this term.
      </p>
      <div>
        {flags.map((f, i) => (
          <div
            key={`${f.courseName}-${i}`}
            className={[
              "flex flex-col gap-1 py-3",
              i < flags.length - 1 ? "border-b" : "",
            ].join(" ")}
            style={{ borderColor: "rgba(201,64,64,0.15)" }}
          >
            <div className="font-serif text-[16px] text-text-primary">
              {f.courseName}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>NCAA: {f.ncaaStatus}</Pill>
              <Pill>A-G: {f.agStatus}</Pill>
            </div>
            <div className="font-sans text-[12px] text-text-secondary">
              Recommended action:{" "}
              <span className="font-sans text-[12px] font-medium text-escalation">
                {translateDualFlagAction(f.recommendedAction)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-sm border bg-surface-card px-2 py-0.5 font-mono text-[11px] text-text-primary"
      style={{ borderColor: "rgba(201,64,64,0.30)" }}
    >
      {children}
    </span>
  );
}

export default DualFlagAlert;

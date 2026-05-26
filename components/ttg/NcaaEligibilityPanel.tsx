"use client";

import * as React from "react";
import Card from "@/components/ui/Card";
import Badge, { BandKey } from "@/components/ui/Badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import type { F3Result } from "@/lib/calculations/f3";
import type { F4Result } from "@/lib/calculations/f4";
import type { F6Result } from "@/lib/calculations/f6";
import type { F7Result } from "@/lib/calculations/f7";

type Props = {
  targetDivision: string;
  f3: F3Result;
  f4: F4Result;
  f6: F6Result;
  f7: F7Result;
};

type Tab = "d1_completion" | "d1_gpa" | "d2";

function qualifierBand(status: string): BandKey {
  if (status === "FULL_QUALIFIER") return "green";
  if (status === "ACADEMIC_REDSHIRT" || status === "PARTIAL_QUALIFIER") return "yellow";
  return "red";
}

export default function NcaaEligibilityPanel({
  targetDivision,
  f3,
  f4,
  f6,
  f7,
}: Props) {
  const showD2 =
    targetDivision === "DII" || targetDivision === "DI_or_DII_undecided";
  const [tab, setTab] = React.useState<Tab>("d1_completion");

  return (
    <Card variant="default" padding="lg">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
          NCAA Eligibility
        </h2>
        <div className="flex gap-2">
          {(
            [
              ["d1_completion", "D1 Completion"],
              ["d1_gpa", "D1 GPA"],
              ...(showD2 ? ([["d2", "D2"]] as const) : []),
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "rounded px-3 py-1 font-mono text-[11px]",
                tab === key
                  ? "bg-olive-600 text-white"
                  : "bg-surface-inner text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "d1_completion" && f3.applicable && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge
              band={f3.fullyComplete ? "green" : "yellow"}
              size="md"
              icon={f3.fullyComplete ? CheckCircle : AlertTriangle}
            >
              {f3.totalCompleted} / {f3.totalRequired} cores
            </Badge>
            <span className="font-mono text-[11px] text-text-secondary">
              Geometry: {f3.geometrySatisfied ? "documented" : "not documented"}
            </span>
          </div>
          <div className="grid gap-1 font-mono text-[11px] text-text-secondary">
            {Object.entries(f3.perCategory).map(([cat, row]) => (
              <div key={cat} className="flex justify-between gap-4">
                <span>{cat}</span>
                <span>
                  {row.completedYears} / {row.requiredYears} yrs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "d1_gpa" && f4.applicable && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge
              band={qualifierBand(f4.qualifierStatus)}
              size="md"
              icon={f4.qualifierStatus === "FULL_QUALIFIER" ? CheckCircle : AlertTriangle}
            >
              {f4.qualifierStatus.replace(/_/g, " ")}
            </Badge>
            <span className="font-mono text-[12px] text-text-primary">
              Core GPA {f4.coreGpaWeighted.toFixed(3)} (weighted)
            </span>
          </div>
          {f4.coresExcludedBeyond16.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-mono text-[11px] text-olive-600">
                Best-16 selection ({f4.coresUsedInCalc} courses used)
              </summary>
              <p className="mt-1 font-mono text-[11px] text-text-tertiary">
                Excluded beyond 16: {f4.coresExcludedBeyond16.join(", ")}
              </p>
            </details>
          )}
        </div>
      )}

      {tab === "d2" && showD2 && (
        <div className="space-y-4">
          {f6.applicable && (
            <div>
              <p className="mb-1 font-sans text-[12px] font-medium text-text-primary">
                D2 completion
              </p>
              <Badge
                band={f6.fullyComplete ? "green" : "yellow"}
                size="sm"
                icon={f6.fullyComplete ? CheckCircle : AlertTriangle}
              >
                {f6.totalCompleted} / {f6.totalRequired} cores
              </Badge>
            </div>
          )}
          {f7.applicable && (
            <div>
              <p className="mb-1 font-sans text-[12px] font-medium text-text-primary">
                D2 GPA
              </p>
              <Badge
                band={qualifierBand(f7.qualifierStatus)}
                size="sm"
                icon={f7.qualifierStatus === "FULL_QUALIFIER" ? CheckCircle : AlertTriangle}
              >
                {f7.qualifierStatus.replace(/_/g, " ")} · {f7.coreGpaWeighted.toFixed(3)}
              </Badge>
            </div>
          )}
        </div>
      )}

      {!f3.applicable && tab === "d1_completion" && (
        <p className="font-sans text-[13px] text-text-secondary">
          D1 completion not applicable for target division {targetDivision}.
        </p>
      )}
    </Card>
  );
}

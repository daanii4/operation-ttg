import * as React from "react";
import { GitBranch, Route } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { translateFallbackAction } from "@/lib/translate/fallback-action";
import type { FallbackPathway } from "@/lib/calculations/f5";

export function FallbackPathwayPanel({ pathway }: { pathway: FallbackPathway }) {
  const title =
    pathway.primary === "NCAA_DII"
      ? "Alternative Pathway: NCAA Division II"
      : pathway.primary === "JUCO"
        ? "Alternative Pathway: JUCO"
        : pathway.primary === "POST_GRAD_EXCEPTION"
          ? "Alternative Pathway: Post-Graduation Exception"
          : "Alternative Pathway";

  return (
    <Card variant="default" padding="lg" className="border border-band-locked-border">
      <div className="mb-4 flex items-center gap-2">
        <Route className="h-4 w-4 text-band-locked" />
        <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
          {title}
        </h2>
        <Badge band="locked" size="sm" icon={GitBranch}>
          Next best path
        </Badge>
      </div>
      <p className="font-sans text-[13px] leading-[1.55] text-text-secondary">
        {pathway.rationale}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {pathway.nextActions.map((action) => (
          <div key={`${action.code}-${action.deadline ?? "none"}`} className="rounded bg-surface-inner p-3">
            <p className="font-sans text-[13px] leading-[1.5] text-text-secondary">
              {translateFallbackAction(action.code)}
            </p>
            {action.deadline && (
              <p className="mt-1 font-mono text-[11px] text-text-tertiary">
                Target date: {new Date(action.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default FallbackPathwayPanel;

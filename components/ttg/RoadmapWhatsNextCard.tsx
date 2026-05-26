import { Target } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { RoadmapNextFocus } from "@/lib/roadmap/types";

export function RoadmapWhatsNextCard({ next }: { next: RoadmapNextFocus }) {
  const band =
    next.status === "planned" ? "locked" : next.status === "partial" ? "yellow" : "yellow";

  return (
    <Card variant="inner" padding="md" className="mt-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gold-500" aria-hidden />
            <h2 className="font-serif text-[18px] text-text-primary">What&apos;s next</h2>
          </div>
          <Badge band={band} size="md" icon={Target}>
            {next.phaseVersion} · {next.status}
          </Badge>
        </div>

        <div>
          <p className="font-sans text-[14px] font-medium text-text-primary">{next.label}</p>
          <p className="mt-1 font-sans text-[13px] leading-[1.55] text-text-secondary">
            {next.detail}
          </p>
        </div>

        {next.blockers.length > 0 ? (
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Phase blockers
            </p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {next.blockers.map((b) => (
                <li key={b} className="font-sans text-[12px] text-text-secondary">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {next.agentQuestions.length > 0 ? (
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Information needed to proceed
            </p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {next.agentQuestions.map((q) => (
                <li
                  key={q}
                  className="font-sans text-[13px] leading-[1.5] text-text-secondary"
                  style={{ textIndent: "-16px", paddingLeft: "16px" }}
                >
                  <span
                    className="mr-2 inline-block h-1 w-1 rounded-full align-middle"
                    style={{ background: "var(--gold-500)" }}
                  />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="border-t border-[color:var(--border-default)] pt-3 font-mono text-[11px] leading-[1.5] text-text-tertiary">
          Agent context: {next.promptForUser}
        </p>
      </div>
    </Card>
  );
}

export default RoadmapWhatsNextCard;

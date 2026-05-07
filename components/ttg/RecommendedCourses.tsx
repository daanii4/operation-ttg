import * as React from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

type Recommendation = {
  courseName: string;
  priority: "HIGH" | "MEDIUM";
  closesSubset: boolean;
  reason: string;
};

type Props = {
  courses: Recommendation[];
  riskBand: "GREEN" | "YELLOW" | "RED" | "LOCKED" | "NOT_APPLICABLE";
};

export function RecommendedCourses({ courses, riskBand }: Props) {
  return (
    <Card variant="default" padding="lg">
      <h2 className="mb-4 font-serif text-[20px] leading-[1.25] text-text-primary">
        Recommended Next-Term Courses
      </h2>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-6">
          <p className="font-sans text-[13px] text-text-secondary">
            No additional Division I course recommendations.
          </p>
          {riskBand === "LOCKED" ? (
            <p className="font-sans text-[12px] text-text-tertiary">
              Use the alternative pathway panel for NCAA DII, JUCO, or post-graduation options.
            </p>
          ) : (
            <p className="font-sans text-[12px] text-band-track">
              On pace — no action required this term.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          {courses.map((c, i) => (
            <div
              key={`${c.courseName}-${i}`}
              className={[
                "flex items-start gap-4 py-3",
                i < courses.length - 1 ? "border-b border-[color:var(--border-default)]" : "",
              ].join(" ")}
            >
              <div className="w-[64px] shrink-0">
                <Badge
                  band={c.priority === "HIGH" ? "red" : "yellow"}
                  size="sm"
                  icon={c.priority === "HIGH" ? AlertTriangle : TrendingDown}
                >
                  {c.priority}
                </Badge>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="font-serif text-[16px] text-text-primary">
                  {c.courseName}
                </span>
                {c.closesSubset && (
                  <span
                    className="inline-flex w-fit items-center rounded-sm border px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      background: "var(--band-track-fill)",
                      borderColor: "var(--band-track-border)",
                      color: "var(--band-track)",
                    }}
                  >
                    Closes EMS gap
                  </span>
                )}
                <p className="font-mono text-[11px] leading-[1.5] text-text-tertiary">
                  {c.reason}
                </p>
              </div>
            </div>
          ))}
          <div className="mt-4 border-t border-[color:var(--border-default)] pt-3 text-right">
            <span className="font-sans text-[11px] italic text-text-tertiary">
              Recommendations are deterministic — derived from rule logic, not generative AI.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

export default RecommendedCourses;

"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge, { type BandKey } from "@/components/ui/Badge";
import EligibilityPanels from "@/components/ttg/EligibilityPanels";
import Link from "next/link";

type Row = {
  studentId: string;
  firstName: string;
  lastName: string;
  grade: number;
  sport: string;
  targetDivision: string;
  highSchoolName: string;
  riskBand: string;
  overallRisk: string;
  agStatus: string;
};

const BAND_TO_KEY: Record<string, BandKey> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  LOCKED: "locked",
};

export default function EligibilityClient({ students }: { students: Row[] }) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <Card variant="default" padding="none" className="mt-2 overflow-hidden">
      <div className="flex items-baseline justify-between border-b border-border-default px-6 py-4">
        <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
          Eligibility — F1 to F7
        </h2>
        <p className="font-sans text-[12px] text-text-tertiary">
          Click a student to expand A-G + NCAA core + GPA qualifier panels.
        </p>
      </div>

      <ul className="divide-y divide-border-default">
        {students.map((s) => {
          const isOpen = expanded === s.studentId;
          return (
            <li key={s.studentId}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : s.studentId)}
                className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-[color:var(--surface-inner)]/60"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-text-tertiary" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-text-tertiary" aria-hidden />
                  )}
                  <div>
                    <span className="font-serif text-[14px] text-text-primary">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="ml-2 font-sans text-[12px] text-text-tertiary">
                      Grade {s.grade} · {s.sport} · {s.targetDivision}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.riskBand !== "NOT_APPLICABLE" && (
                    <Badge band={BAND_TO_KEY[s.riskBand] ?? "green"} size="sm">
                      10/7 {s.riskBand}
                    </Badge>
                  )}
                  <Badge
                    band={
                      s.agStatus === "RED"
                        ? "red"
                        : s.agStatus === "YELLOW"
                          ? "yellow"
                          : "green"
                    }
                    size="sm"
                  >
                    A-G {s.agStatus}
                  </Badge>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-border-default bg-[color:var(--surface-inner)]/40 px-6 py-5">
                  <EligibilityPanels
                    studentId={s.studentId}
                    targetDivision={s.targetDivision}
                  />
                  <div className="mt-4">
                    <Link
                      href={`/students/${s.studentId}`}
                      className="font-sans text-[12px] text-[var(--olive-700)] underline-offset-2 hover:underline"
                    >
                      Open full student profile →
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

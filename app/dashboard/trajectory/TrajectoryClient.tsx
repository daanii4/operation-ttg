"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge, { type BandKey } from "@/components/ui/Badge";
import type { F9Result, F10Result, F11Result } from "@/lib/calculations/types";

type Row = {
  studentId: string;
  firstName: string;
  lastName: string;
  grade: number;
  sport: string;
  targetDivision: string;
  riskBand: string;
  overallRisk: string;
  gpaTrajectory: string;
  aimsRisk: string;
  aimsReason: string | null;
};

type EligibilityPayload = {
  f9?: F9Result;
  f10?: F10Result;
  f11?: F11Result;
};

const TRAJECTORY_TONE: Record<string, BandKey> = {
  improving: "green",
  flat: "yellow",
  declining: "red",
};

const AIMS_TONE: Record<string, BandKey> = {
  STABLE: "green",
  ESCALATED: "yellow",
  HIGH: "escalation",
};

export default function TrajectoryClient({ students }: { students: Row[] }) {
  return (
    <Card variant="default" padding="none" className="mt-2 overflow-hidden">
      <div className="flex items-baseline justify-between border-b border-border-default px-6 py-4">
        <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
          Trends & Signals
        </h2>
        <p className="font-sans text-[12px] text-text-tertiary">
          GPA trajectory · AIMS risk · engagement metrics — click a row for detail.
        </p>
      </div>

      <ul className="divide-y divide-border-default">
        {students.map((s) => (
          <TrajectoryRow key={s.studentId} row={s} />
        ))}
      </ul>
    </Card>
  );
}

function TrajectoryRow({ row }: { row: Row }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<EligibilityPayload | null>(null);

  const onToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !data && !loading) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/students/${row.studentId}/eligibility`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load trajectory");
        setData((await res.json()) as EligibilityPayload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-[color:var(--surface-inner)]/60"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="h-4 w-4 text-text-tertiary" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-tertiary" aria-hidden />
          )}
          <div>
            <span className="font-serif text-[14px] text-text-primary">
              {row.firstName} {row.lastName}
            </span>
            <span className="ml-2 font-sans text-[12px] text-text-tertiary">
              Grade {row.grade} · {row.sport} · {row.targetDivision}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            band={TRAJECTORY_TONE[row.gpaTrajectory] ?? "yellow"}
            size="sm"
            icon={row.gpaTrajectory === "declining" ? TrendingDown : TrendingUp}
          >
            GPA {row.gpaTrajectory}
          </Badge>
          <Badge band={AIMS_TONE[row.aimsRisk] ?? "yellow"} size="sm">
            AIMS {row.aimsRisk}
          </Badge>
        </div>
      </button>
      {open && (
        <div className="border-t border-border-default bg-[color:var(--surface-inner)]/40 px-6 py-5">
          {loading && (
            <p className="flex items-center gap-2 font-mono text-[12px] text-text-tertiary">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Loading signal data…
            </p>
          )}
          {error && (
            <p role="alert" className="font-sans text-[12px] text-band-urgent">
              {error}
            </p>
          )}
          {data && <TrajectoryDetail data={data} aimsReason={row.aimsReason} />}
        </div>
      )}
    </li>
  );
}

function TrajectoryDetail({
  data,
  aimsReason,
}: {
  data: EligibilityPayload;
  aimsReason: string | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <DetailCard title="F9 — GPA Trajectory">
        <DetailRow label="Slope">
          {data.f9?.slope != null ? data.f9.slope.toFixed(3) : "—"}
        </DetailRow>
        <DetailRow label="Direction">{data.f9?.direction ?? "—"}</DetailRow>
        <DetailRow label="Regression flag">
          {data.f9?.regression_flag ? "Yes" : "No"}
        </DetailRow>
        <DetailRow label="Plateau flag">
          {data.f9?.plateau_flag ? "Yes" : "No"}
        </DetailRow>
        <DetailRow label="Evidence tier">
          {data.f9?.evidence_tier ?? "—"}
        </DetailRow>
        {data.f9?.insufficient_reason ? (
          <p className="mt-2 font-sans text-[11px] text-text-tertiary">
            {data.f9.insufficient_reason}
          </p>
        ) : null}
      </DetailCard>

      <DetailCard title="F10 — AIMS Risk Signal">
        <DetailRow label="Risk band">{data.f10?.risk_band ?? "—"}</DetailRow>
        <DetailRow label="Within-subject Δ%">
          {data.f10?.within_subject_delta_pct != null
            ? `${(data.f10.within_subject_delta_pct * 100).toFixed(1)}%`
            : "—"}
        </DetailRow>
        <DetailRow label="Cross-layer flags">
          {data.f10?.cross_layer_flags?.length
            ? data.f10.cross_layer_flags.join(", ")
            : "None"}
        </DetailRow>
        <DetailRow label="Evidence tier">
          {data.f10?.evidence_tier ?? "—"}
        </DetailRow>
        {aimsReason ? (
          <p className="mt-2 font-sans text-[11px] text-text-tertiary">
            {aimsReason}
          </p>
        ) : null}
      </DetailCard>

      <DetailCard title="F11 — Engagement">
        <DetailRow label="Window avg">
          {data.f11?.window_avg != null ? data.f11.window_avg.toFixed(2) : "—"}
        </DetailRow>
        <DetailRow label="Trend">{data.f11?.trend ?? "—"}</DetailRow>
        <DetailRow label="Withdrawal flag">
          {data.f11?.withdrawal_flag ? "Yes" : "No"}
        </DetailRow>
        <DetailRow label="Consecutive absences">
          {data.f11?.consecutive_absences ?? 0}
        </DetailRow>
        <DetailRow label="Evidence tier">
          {data.f11?.evidence_tier ?? "—"}
        </DetailRow>
      </DetailCard>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded bg-surface-card p-4 shadow-sm">
      <h3 className="font-serif text-[14px] text-text-primary">{title}</h3>
      <dl className="mt-3 flex flex-col gap-1.5">{children}</dl>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="font-sans text-[11px] text-text-tertiary">{label}</dt>
      <dd className="font-mono text-[12px] text-text-primary">{children}</dd>
    </div>
  );
}

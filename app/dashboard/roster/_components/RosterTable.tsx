"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronRight, Flag } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { ActionWindowPill, BandBadge } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";
import { BAND_RANK, compareRosterUrgency } from "@/lib/roster/roster-sort";
import type { RiskBand } from "@/components/ttg/risk-vocabulary";
import {
  ROSTER_COLUMN_TEMPLATE,
  ROSTER_TABLE_HEADER_TOP_PX,
} from "./roster-layout";

type SortKey = "name" | "sport" | "grad" | "band" | "weeks" | "cores";
type SortDir = "asc" | "desc";

export interface RosterTableProps {
  rows: QnRosterRow[];
  loading?: boolean;
}

export function RosterTable({ rows, loading = false }: RosterTableProps) {
  const router = useRouter();
  const [sort, setSort] = React.useState<{ key: SortKey; dir: SortDir } | null>(null);

  const sorted = React.useMemo(() => {
    if (!sort) return [...rows].sort(compareRosterUrgency);
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sort.key) {
        case "name":
          return a.fullName.localeCompare(b.fullName) * dir;
        case "sport":
          return a.sport.localeCompare(b.sport) * dir;
        case "grad":
          return (a.graduationYear - b.graduationYear) * dir;
        case "band":
          return (BAND_RANK[a.riskBand] - BAND_RANK[b.riskBand]) * dir;
        case "weeks": {
          const aw = a.daysToLock ?? (a.riskBand === "LOCKED" ? -1 : Number.POSITIVE_INFINITY);
          const bw = b.daysToLock ?? (b.riskBand === "LOCKED" ? -1 : Number.POSITIVE_INFINITY);
          return (aw - bw) * dir;
        }
        case "cores":
          return (b.missingTotal - a.missingTotal) * dir;
      }
    });
  }, [rows, sort]);

  const onSortClick = (key: SortKey) =>
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });

  const navigate = (id: string) => router.push(`/students/${id}`);

  if (loading) {
    return (
      <div className="px-4 py-2" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-2 flex gap-3 py-3">
            <div className="skeleton h-10 min-w-0 flex-1 rounded" />
            <div className="skeleton h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div role="table" aria-label="Student roster" className="min-w-0 overflow-x-auto">
      <div className="w-full min-w-[960px]">
        <div role="rowgroup">
          <div
            role="row"
            className="grid w-full items-center bg-surface-inverse text-white"
            style={{
              gridTemplateColumns: ROSTER_COLUMN_TEMPLATE,
              columnGap: 16,
              padding: "12px 16px",
              position: "sticky",
              top: ROSTER_TABLE_HEADER_TOP_PX,
              zIndex: 10,
            }}
          >
            <SortableHeader
              label="Student"
              active={sort?.key === "name"}
              dir={sort?.key === "name" ? sort.dir : null}
              onClick={() => onSortClick("name")}
            />
            <SortableHeader
              label="Sport"
              active={sort?.key === "sport"}
              dir={sort?.key === "sport" ? sort.dir : null}
              onClick={() => onSortClick("sport")}
            />
            <SortableHeader
              label="Grad"
              active={sort?.key === "grad"}
              dir={sort?.key === "grad" ? sort.dir : null}
              onClick={() => onSortClick("grad")}
            />
            <SortableHeader
              label="Status"
              active={sort?.key === "band"}
              dir={sort?.key === "band" ? sort.dir : null}
              onClick={() => onSortClick("band")}
            />
            <SortableHeader
              label="Action window"
              active={sort?.key === "weeks"}
              dir={sort?.key === "weeks" ? sort.dir : null}
              onClick={() => onSortClick("weeks")}
            />
            <SortableHeader
              label="Cores / EMS"
              active={sort?.key === "cores"}
              dir={sort?.key === "cores" ? sort.dir : null}
              onClick={() => onSortClick("cores")}
            />
            <HeaderCell label="Flags" />
            <span aria-hidden />
          </div>
        </div>

        <div role="rowgroup">
          {sorted.map((row, idx) => (
            <RosterRow
              key={row.studentId}
              row={row}
              idx={idx}
              isLast={idx === sorted.length - 1}
              onNavigate={navigate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RosterRow({
  row,
  idx,
  isLast,
  onNavigate,
}: {
  row: QnRosterRow;
  idx: number;
  isLast: boolean;
  onNavigate: (id: string) => void;
}) {
  const isOdd = idx % 2 === 1;
  const division = row.targetDivision.replace(/_/g, " ");

  return (
    <div
      role="row"
      tabIndex={0}
      onClick={() => onNavigate(row.studentId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(row.studentId);
        }
      }}
      className={[
        "qn-roster-row grid w-full cursor-pointer items-center",
        "transition-colors duration-[var(--duration-instant)] ease-[var(--ease-out)]",
        "hover:bg-[color:var(--surface-inner)]/60 active:bg-olive-50",
        "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--olive-600)] focus-visible:[outline-offset:-2px]",
      ].join(" ")}
      style={{
        gridTemplateColumns: ROSTER_COLUMN_TEMPLATE,
        columnGap: 16,
        padding: "14px 16px",
        minHeight: 56,
        background: isOdd ? "rgba(238, 240, 232, 0.55)" : "var(--surface-card)",
        borderBottom: isLast ? "none" : "1px solid var(--border-default)",
      }}
    >
      <div className="min-w-0">
        <Link
          href={`/students/${row.studentId}`}
          onClick={(e) => e.stopPropagation()}
          className="block truncate font-serif text-[13px] font-semibold leading-5 text-text-primary hover:underline"
        >
          {row.fullName}
        </Link>
        <p className="mt-0.5 truncate font-sans text-[12px] text-text-secondary">
          Grade {row.grade} · {division}
        </p>
      </div>

      <span className="truncate font-sans text-[13px] text-text-primary">{row.sport}</span>

      <span className="font-mono text-[13px] text-text-primary">{row.graduationYear}</span>

      <span>
        <BandBadge band={row.riskBand} />
      </span>

      <ActionWindowCell row={row} />

      <CoresCell row={row} />

      <span>
        {row.agDualFlagCount > 0 ? (
          <Badge band="escalation" size="sm" icon={Flag}>
            A-G
          </Badge>
        ) : null}
      </span>

      <span className="flex justify-end" aria-hidden>
        <ChevronRight size={16} className="text-text-tertiary" />
      </span>
    </div>
  );
}

function ActionWindowCell({ row }: { row: QnRosterRow }) {
  if (row.riskBand === "LOCKED") {
    return <span className="font-mono text-[13px] font-medium text-band-pivot">Past lock</span>;
  }
  if (row.weeksToCriticalAction != null && row.weeksToCriticalAction <= 4) {
    return <ActionWindowPill weeks={row.weeksToCriticalAction} />;
  }
  if (row.daysToLock != null) {
    return (
      <span className="font-mono text-[13px] text-text-primary">
        {row.provisionalFlag ? "~" : ""}
        {row.daysToLock}
        <span className="ml-0.5 text-[11px] text-text-tertiary">d</span>
      </span>
    );
  }
  return <span className="font-mono text-[13px] text-text-tertiary">—</span>;
}

function CoresCell({ row }: { row: QnRosterRow }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="font-mono text-[13px] text-text-primary">
        {row.completedTotal}/10 · {row.completedEngMathSci}/7
      </span>
      {row.missingTotal > 0 ? (
        <span
          className={[
            "rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium",
            row.riskBand === "GREEN"
              ? "border-[color:var(--color-green)] bg-[var(--color-green-tint)] text-[#15803d]"
              : row.riskBand === "YELLOW"
                ? "border-[color:var(--color-yellow)] bg-[var(--color-yellow-tint)] text-[#b45309]"
                : row.riskBand === "RED"
                  ? "border-[color:var(--color-red-tint)] bg-[var(--color-red-tint)] text-[#b91c1c]"
                  : "border-[color:var(--color-escalated)] bg-[var(--color-escalated-tint)] text-[#6d28d9]",
          ].join(" ")}
        >
          {row.missingTotal} missing
        </span>
      ) : null}
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
    <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90">
      {label}
    </span>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className="inline-flex items-center gap-1 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/85"
    >
      <span>{label}</span>
      {active ? (
        dir === "asc" ? (
          <ArrowUp size={12} aria-hidden />
        ) : (
          <ArrowDown size={12} aria-hidden />
        )
      ) : null}
    </button>
  );
}

export default RosterTable;

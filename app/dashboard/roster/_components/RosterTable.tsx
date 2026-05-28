"use client";

/**
 * Roster table (desktop) — rows inside the page Card shell.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { ActionWindowPill, BandBadge, type Band } from "@/components/ui/qn";
import type { QnRosterRow } from "@/lib/cohort/qn-roster";

type SortKey = "name" | "grad" | "band" | "weeks";
type SortDir = "asc" | "desc";

const BAND_RANK: Record<Band, number> = {
  ESCALATED: 0,
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
};

const COLUMN_TEMPLATE =
  "minmax(200px,1fr) 120px 80px 110px 160px minmax(240px,2fr) 32px";

/** AppHeader (96px) + gold rule (4px) */
const STICKY_HEADER_TOP = 100;

export interface RosterTableProps {
  rows: QnRosterRow[];
}

export function RosterTable({ rows }: RosterTableProps) {
  const router = useRouter();
  const [sort, setSort] = React.useState<{ key: SortKey; dir: SortDir } | null>(null);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sort.key) {
        case "name":
          return a.fullName.localeCompare(b.fullName) * dir;
        case "grad":
          return (a.graduationYear - b.graduationYear) * dir;
        case "band":
          return (BAND_RANK[a.band] - BAND_RANK[b.band]) * dir;
        case "weeks": {
          const aw = a.weeksToCriticalAction ?? Number.POSITIVE_INFINITY;
          const bw = b.weeksToCriticalAction ?? Number.POSITIVE_INFINITY;
          return (aw - bw) * dir;
        }
      }
    });
  }, [rows, sort]);

  const onSortClick = (key: SortKey) =>
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });

  const navigate = (id: string) => router.push(`/students/${id}`);

  return (
    <div role="table" aria-label="Student roster" className="min-w-0 overflow-x-auto">
      <div role="rowgroup">
        <div
          role="row"
          className="grid items-center border-b border-[var(--border-default)] bg-[var(--surface-inner)]"
          style={{
            gridTemplateColumns: COLUMN_TEMPLATE,
            columnGap: 16,
            padding: "12px 20px",
            position: "sticky",
            top: STICKY_HEADER_TOP,
            zIndex: 5,
          }}
        >
          <SortableHeader
            label="Student"
            active={sort?.key === "name"}
            dir={sort?.key === "name" ? sort.dir : null}
            onClick={() => onSortClick("name")}
          />
          <HeaderCell label="Sport" />
          <SortableHeader
            label="Grad"
            active={sort?.key === "grad"}
            dir={sort?.key === "grad" ? sort.dir : null}
            onClick={() => onSortClick("grad")}
          />
          <SortableHeader
            label="Band"
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
          <HeaderCell label="Primary concern" />
          <span aria-hidden />
        </div>
      </div>

      <div role="rowgroup">
        {sorted.map((row, idx) => {
          const isAlt = idx % 2 === 1;
          return (
            <div
              key={row.studentId}
              role="row"
              tabIndex={0}
              onClick={() => navigate(row.studentId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(row.studentId);
                }
              }}
              className="qn-roster-row grid cursor-pointer items-center transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-inner)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--olive-600)]"
              style={{
                gridTemplateColumns: COLUMN_TEMPLATE,
                columnGap: 16,
                padding: "14px 20px",
                minHeight: 56,
                background: isAlt ? "var(--surface-inner)" : "var(--surface-card)",
                borderBottom:
                  idx === sorted.length - 1 ? "none" : "1px solid var(--border-default)",
              }}
            >
              <div className="min-w-0">
                <Link
                  href={`/students/${row.studentId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="qn-row-name truncate text-[13px] font-semibold leading-5 hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {row.fullName}
                </Link>
              </div>
              <span className="text-[13px] leading-5" style={{ color: "var(--text-primary)" }}>
                {row.sport}
              </span>
              <span
                className="font-mono text-[13px] leading-5"
                style={{ color: "var(--text-primary)" }}
              >
                {row.graduationYear}
              </span>
              <span>
                <BandBadge band={row.band} />
              </span>
              <span>
                {row.weeksToCriticalAction != null && row.weeksToCriticalAction <= 4 ? (
                  <ActionWindowPill weeks={row.weeksToCriticalAction} />
                ) : (
                  <span style={{ color: "var(--text-tertiary)" }}>—</span>
                )}
              </span>
              <span
                className="truncate text-[13px] leading-5"
                style={{ color: "var(--text-secondary)" }}
                title={row.primaryConcern ?? undefined}
              >
                {row.primaryConcern ?? "—"}
              </span>
              <span className="flex justify-center" aria-hidden>
                <ChevronRight size={16} style={{ color: "var(--text-quaternary)" }} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
    <span
      className="font-sans text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[var(--text-tertiary)]"
    >
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
      className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[var(--text-tertiary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
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

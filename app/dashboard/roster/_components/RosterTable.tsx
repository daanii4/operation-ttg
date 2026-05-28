"use client";

/**
 * QuasarNova v1 — §2.3 Roster table (desktop).
 *
 * Bordered card, sticky header row, alternating-row striping, hover highlight,
 * and full-row click navigation. The whole row is the link surface but the
 * Student name is the visible affordance; only the chevron is a separate
 * focusable target so keyboard users still get a single focus stop per row.
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
    <div
      className="overflow-hidden rounded-lg bg-white"
      style={{ border: "1px solid var(--color-border)" }}
      role="table"
      aria-label="Student roster"
    >
      <div role="rowgroup">
        <div
          role="row"
          className="grid items-center"
          style={{
            gridTemplateColumns: COLUMN_TEMPLATE,
            columnGap: 16,
            background: "var(--color-row-alt)",
            borderBottom: "1px solid var(--color-border)",
            padding: "12px 16px",
            position: "sticky",
            top: 113, // 56 (top bar) + ~57 (sticky filter bar)
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
              className="qn-roster-row grid cursor-pointer items-center transition-colors duration-[120ms] ease-out hover:bg-[var(--color-row-alt)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
              style={{
                gridTemplateColumns: COLUMN_TEMPLATE,
                columnGap: 16,
                padding: "14px 16px",
                minHeight: 56,
                background: isAlt ? "var(--color-row-alt)" : "var(--color-bg)",
                borderBottom:
                  idx === sorted.length - 1 ? "none" : "1px solid var(--color-border)",
              }}
            >
              <div className="min-w-0">
                <Link
                  href={`/students/${row.studentId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="qn-row-name truncate text-[13px] font-semibold leading-5 hover:underline"
                  style={{ color: "var(--color-text)" }}
                >
                  {row.fullName}
                </Link>
              </div>
              <span className="text-[13px] leading-5" style={{ color: "var(--color-text)" }}>
                {row.sport}
              </span>
              <span
                className="font-mono text-[13px] leading-5"
                style={{ color: "var(--color-text)" }}
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
                  <span style={{ color: "var(--color-muted)" }}>—</span>
                )}
              </span>
              <span
                className="truncate text-[13px] leading-5"
                style={{ color: "#374151" }}
                title={row.primaryConcern ?? undefined}
              >
                {row.primaryConcern ?? "—"}
              </span>
              <span className="flex justify-center" aria-hidden>
                <ChevronRight size={16} style={{ color: "#9CA3AF" }} />
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
      className="text-[11px] font-semibold uppercase leading-4"
      style={{ color: "var(--color-muted)", letterSpacing: "0.06em" }}
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
      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase leading-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
      style={{ color: "var(--color-muted)", letterSpacing: "0.06em" }}
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

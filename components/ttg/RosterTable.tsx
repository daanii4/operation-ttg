"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flag,
  GitBranch,
  TrendingDown,
  Users,
  type LucideIcon,
} from "lucide-react";
import Badge, { BandKey } from "@/components/ui/Badge";
import Link from "@/components/ui/Link";
import type { CohortStudentRow } from "@/app/api/cohort/route";
import { RISK_VOCABULARY } from "./risk-vocabulary";

type SortKey = "name" | "overallRisk" | "grade" | "daysToLock" | "completedTotal" | "completedEms";
type SortDir = "asc" | "desc";

const RISK_ORDER: Record<string, number> = {
  LOCKED: 0,
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
  NOT_APPLICABLE: 4,
};

const OVERALL_ORDER: Record<string, number> = {
  CRITICAL: 0,
  AT_RISK: 1,
  STABLE: 2,
  ON_TRACK: 3,
};

const BAND_TO_KEY: Record<string, BandKey> = {
  GREEN: "green",
  YELLOW: "yellow",
  RED: "red",
  LOCKED: "locked",
};

export function RosterTable({
  data,
  stickyHeader = false,
}: {
  data: CohortStudentRow[];
  stickyHeader?: boolean;
}) {
  const router = useRouter();
  const [sort, setSort] = React.useState<{ column: SortKey; dir: SortDir } | null>(null);

  const sorted = React.useMemo(() => {
    if (!sort) {
      return [...data].sort((a, b) => {
        const oa = OVERALL_ORDER[a.overallRisk] ?? 9;
        const ob = OVERALL_ORDER[b.overallRisk] ?? 9;
        if (oa !== ob) return oa - ob;
        const ra = RISK_ORDER[a.riskBand] ?? 9;
        const rb = RISK_ORDER[b.riskBand] ?? 9;
        if (ra !== rb) return ra - rb;
        const da = a.daysToLock ?? Infinity;
        const db = b.daysToLock ?? Infinity;
        return da - db;
      });
    }
    const dir = sort.dir === "asc" ? 1 : -1;
    const key = sort.column;
    return [...data].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      switch (key) {
        case "name":
          av = `${a.lastName} ${a.firstName}`;
          bv = `${b.lastName} ${b.firstName}`;
          return av.localeCompare(bv) * dir;
        case "overallRisk":
          return ((OVERALL_ORDER[a.overallRisk] ?? 9) - (OVERALL_ORDER[b.overallRisk] ?? 9)) * dir;
        case "grade":
          return (a.grade - b.grade) * dir;
        case "daysToLock":
          av = a.daysToLock ?? Infinity;
          bv = b.daysToLock ?? Infinity;
          return ((av as number) - (bv as number)) * dir;
        case "completedTotal":
          return (a.completedTotal - b.completedTotal) * dir;
        case "completedEms":
          return (a.completedEngMathSci - b.completedEngMathSci) * dir;
      }
    });
  }, [data, sort]);

  const onSort = (column: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) return { column, dir: "asc" };
      return { column, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  };

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (!sort || sort.column !== column) return null;
    return sort.dir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center gap-1">
        <Users className="h-8 w-8 text-text-tertiary opacity-60" />
        <p className="font-sans text-[14px] text-text-secondary">
          No student-athletes in this cohort yet
        </p>
        <p className="font-sans text-[12px] text-text-tertiary">
          Add students from the Intake screen to begin tracking eligibility.
        </p>
      </div>
    );
  }

  const cols = "grid-cols-[1.5fr_110px_54px_100px_90px_100px_70px_110px_70px_70px]";

  return (
    <>
      {/* Desktop / tablet table — hidden on mobile */}
      <div className="mobile:hidden">
        <div
          className={[
            `grid ${cols} gap-x-4 bg-surface-inverse px-6 py-3 text-white`,
            stickyHeader ? "sticky top-0 z-10" : "",
          ].join(" ")}
        >
          <SortableHeader label="NAME"         onClick={() => onSort("name")}            indicator={<SortIndicator column="name" />}            align="left" />
          <SortableHeader label="OVERALL RISK" onClick={() => onSort("overallRisk")}     indicator={<SortIndicator column="overallRisk" />}     align="left" />
          <SortableHeader label="GRADE"        onClick={() => onSort("grade")}           indicator={<SortIndicator column="grade" />}           align="right" />
          <HeaderCell    label="SPORT"         align="left" />
          <HeaderCell    label="STATUS"        align="left" />
          <SortableHeader label="DAYS TO LOCK" onClick={() => onSort("daysToLock")}      indicator={<SortIndicator column="daysToLock" />}      align="right" />
          <SortableHeader label="CORES"        onClick={() => onSort("completedTotal")}  indicator={<SortIndicator column="completedTotal" />}  align="right" />
          <SortableHeader label="ENG/MATH/SCI" onClick={() => onSort("completedEms")}    indicator={<SortIndicator column="completedEms" />}    align="right" />
          <HeaderCell    label="FLAGS"         align="left" />
          <HeaderCell    label=""              align="right" />
        </div>

        {sorted.map((s, i) => {
          const isOdd = i % 2 === 1;
          return (
            <div
              key={s.studentId}
              role="row"
              tabIndex={0}
              onClick={() => router.push(`/students/${s.studentId}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/students/${s.studentId}`);
              }}
              className={[
                "grid cursor-pointer transition-colors duration-100 ease-out",
                cols,
                "gap-x-4 px-6 py-3 hover:bg-[color:var(--surface-inner)]/60",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--olive-600)] focus-visible:[outline-offset:-2px]",
              ].join(" ")}
              style={{
                background: isOdd ? "rgba(238, 240, 232, 0.3)" : undefined,
                minHeight: 44,
              }}
            >
              <Cell align="left">
                <span className="font-serif text-[14px] text-text-primary">
                  {s.firstName} {s.lastName}
                </span>
              </Cell>
              <Cell align="left">
                <OverallBadge risk={s.overallRisk} />
              </Cell>
              <Cell align="right">
                <span className="font-mono text-[12px] text-text-primary">{s.grade}</span>
              </Cell>
              <Cell align="left">
                <span className="font-sans text-[12px] text-text-secondary">{s.sport}</span>
              </Cell>
              <Cell align="left">
                {s.riskBand !== "NOT_APPLICABLE" && (
                  <Badge
                    band={BAND_TO_KEY[s.riskBand]}
                    size="sm"
                    icon={RISK_VOCABULARY[s.riskBand].icon}
                  >
                    {RISK_VOCABULARY[s.riskBand].label}
                  </Badge>
                )}
              </Cell>
              <Cell align="right">
                {s.riskBand === "LOCKED" ? (
                  <span className="font-mono text-[12px] text-band-locked">Past lock</span>
                ) : s.daysToLock != null ? (
                  <span className="font-mono text-[12px] text-text-primary">
                    {s.daysToLock}
                    <span className="ml-0.5 text-text-tertiary">d</span>
                  </span>
                ) : (
                  <span className="font-mono text-[12px] text-text-tertiary">—</span>
                )}
              </Cell>
              <Cell align="right">
                <span className="font-mono text-[12px]">
                  <span className="text-text-primary">{s.completedTotal}</span>
                  <span className="text-text-tertiary"> / 10</span>
                </span>
              </Cell>
              <Cell align="right">
                <span className="font-mono text-[12px]">
                  <span className="text-text-primary">{s.completedEngMathSci}</span>
                  <span className="text-text-tertiary"> / 7</span>
                </span>
              </Cell>
              <Cell align="left">
                {s.agDualFlagCount > 0 && (
                  <Badge band="escalation" size="sm" icon={Flag}>
                    A-G
                  </Badge>
                )}
              </Cell>
              <Cell align="right">
                <Link
                  href={`/students/${s.studentId}`}
                  icon="arrow"
                  className="text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  Profile
                </Link>
              </Cell>
            </div>
          );
        })}
      </div>

      {/* Mobile card list */}
      <div className="hidden mobile:flex mobile:flex-col mobile:gap-3 mobile:p-4">
        {sorted.map((s) => (
          <div
            key={s.studentId}
            className="flex flex-col gap-2 rounded bg-surface-card p-4 shadow-sm"
            onClick={() => router.push(`/students/${s.studentId}`)}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-[16px] text-text-primary">
                {s.firstName} {s.lastName}
              </span>
              {s.riskBand !== "NOT_APPLICABLE" && (
                <Badge
                  band={BAND_TO_KEY[s.riskBand]}
                  size="sm"
                  icon={RISK_VOCABULARY[s.riskBand].icon}
                >
                  {RISK_VOCABULARY[s.riskBand].label}
                </Badge>
              )}
            </div>
            <div className="font-sans text-[12px] text-text-secondary">
              Grade {s.grade} · {s.sport}
            </div>
            <div>
              <OverallBadge risk={s.overallRisk} />
            </div>
            <Stat label="Days to Lock" value={s.riskBand === "LOCKED" ? "Past lock" : `${s.daysToLock ?? "—"} d`} />
            <Stat label="Cores" value={`${s.completedTotal} / 10`} />
            <Stat label="Eng/Math/Sci" value={`${s.completedEngMathSci} / 7`} />
            {s.agDualFlagCount > 0 && (
              <div>
                <Badge band="escalation" size="sm" icon={Flag}>
                  A-G
                </Badge>
              </div>
            )}
            <div className="flex justify-end pt-1">
              <Link href={`/students/${s.studentId}`} icon="arrow" className="text-[11px]">
                Profile
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function HeaderCell({ label, align }: { label: string; align: "left" | "right" }) {
  return (
    <div
      className={[
        "font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-white/90",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

function SortableHeader({
  label,
  onClick,
  indicator,
  align,
}: {
  label: string;
  onClick: () => void;
  indicator: React.ReactNode;
  align: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-white/90",
        align === "right" ? "justify-end" : "justify-start",
        "focus-ring-gold rounded-sm",
      ].join(" ")}
    >
      <span>{label}</span>
      {indicator}
    </button>
  );
}

function Cell({ align, children }: { align: "left" | "right"; children: React.ReactNode }) {
  return (
    <div
      className={["flex items-center", align === "right" ? "justify-end" : "justify-start"].join(" ")}
    >
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-[12px] text-text-tertiary">{label}</span>
      <span className="font-mono text-[12px] text-text-primary">{value}</span>
    </div>
  );
}

function OverallBadge({ risk }: { risk: string }) {
  const band: BandKey =
    risk === "CRITICAL"
      ? "escalation"
      : risk === "AT_RISK"
        ? "yellow"
        : risk === "STABLE"
          ? "locked"
          : "green";
  const label = risk.replace("_", " ");
  const icon: LucideIcon =
    risk === "CRITICAL"
      ? AlertTriangle
      : risk === "AT_RISK"
        ? TrendingDown
        : risk === "STABLE"
          ? GitBranch
          : RISK_VOCABULARY.GREEN.icon;
  return (
    <Badge band={band} size="sm" icon={icon}>
      {label}
    </Badge>
  );
}

export default RosterTable;

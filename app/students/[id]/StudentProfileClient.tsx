"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdvisorRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { ActionWindowPill, BandBadge, Button, type Band } from "@/components/ui/qn";
import { ExportPDFButton } from "@/app/dashboard/briefings/_components/ExportPDFButton";
import { hasPermission } from "@/lib/auth/ttg-permissions";
import { mlRiskTierLabel } from "@/lib/calculations/display-labels";
import { ProfileOverviewTab } from "./_components/ProfileOverviewTab";
import { ProfileEligibilityTab } from "./_components/ProfileEligibilityTab";
import { ProfileTrajectoryTab } from "./_components/ProfileTrajectoryTab";
import { ProfileTranscriptTab } from "./_components/ProfileTranscriptTab";
import type {
  ProfileEligibilityPayload,
  ProfileStudent,
  ProfileTab,
} from "./profile-types";
import {
  formatTargetDivision,
  gradeToGradYear,
  profileQuickStats,
  studentInitials,
} from "./profile-utils";

const TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "eligibility", label: "Eligibility" },
  { id: "trajectory", label: "Trajectory" },
  { id: "transcript", label: "Transcript" },
];

export interface StudentProfileClientProps {
  student: ProfileStudent;
  eligibility: ProfileEligibilityPayload | null;
  teamRole: AdvisorRole;
  sessionUserId: string;
}

export default function StudentProfileClient({
  student,
  eligibility: initialEligibility,
  teamRole,
  sessionUserId,
}: StudentProfileClientProps) {
  const router = useRouter();
  const [tab, setTab] = React.useState<ProfileTab>("overview");
  const [eligibility, setEligibility] = React.useState(initialEligibility);

  const canEdit = hasPermission(teamRole, "student:write");
  const fullName = `${student.firstName} ${student.lastName}`;
  const gradYear = gradeToGradYear(student.grade);
  const stats = profileQuickStats(student, eligibility);
  const band = eligibility?.f8?.composite_band as Band | undefined;
  const weeks = eligibility?.f12?.weeks_to_critical_action ?? null;

  const refreshEligibility = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/students/${student.id}/eligibility`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const payload = (await res.json()) as ProfileEligibilityPayload;
      setEligibility(payload);
    } catch {
      // profile remains on last known eligibility
    }
  }, [student.id]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/roster")}
            className="inline-flex shrink-0 items-center gap-1 font-sans text-[13px] font-medium text-[var(--olive-600)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
          >
            <ArrowLeft size={16} aria-hidden />
            Roster
          </button>
          <h1 className="truncate font-serif text-[22px] text-[var(--text-primary)] md:text-[26px]">
            {fullName}
          </h1>
          {band ? <BandBadge band={band} className="shrink-0" /> : null}
        </div>
        <ExportPDFButton
          studentId={student.id}
          studentName={fullName}
          filenameHint={`${student.lastName}-${student.firstName}`}
        />
      </div>

      {/* Mobile compact student strip */}
      <div className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-3 md:hidden">
        <InitialsAvatar first={student.firstName} last={student.lastName} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-[14px] font-semibold text-[var(--text-primary)]">
            {student.sport}
          </p>
          <p className="truncate font-sans text-[12px] text-[var(--text-tertiary)]">
            {student.highSchoolName}
          </p>
        </div>
        {weeks != null && weeks <= 4 ? (
          <ActionWindowPill weeks={weeks} />
        ) : null}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Left panel — desktop */}
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <StudentInfoPanel
            student={student}
            gradYear={gradYear}
            stats={stats}
            band={band}
            weeks={weeks}
            eligibility={eligibility}
            canEdit={canEdit}
          />
        </aside>

        {/* Right panel */}
        <div className="min-w-0 flex-1">
          <div
            role="tablist"
            aria-label="Student profile sections"
            className="qn-no-scrollbar mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border-default)]"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "shrink-0 border-b-2 px-3 py-2 font-sans text-[13px] font-medium transition-colors",
                  tab === t.id
                    ? "border-[var(--olive-600)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {tab === "overview" ? (
              <ProfileOverviewTab
                studentId={student.id}
                eligibility={eligibility}
                sessionUserId={sessionUserId}
                teamRole={teamRole}
                assignedAdvisorId={student.advisorId}
                onEligibilityRefresh={refreshEligibility}
              />
            ) : null}
            {tab === "eligibility" ? (
              <ProfileEligibilityTab student={student} eligibility={eligibility} />
            ) : null}
            {tab === "trajectory" ? (
              <ProfileTrajectoryTab eligibility={eligibility} />
            ) : null}
            {tab === "transcript" ? (
              <ProfileTranscriptTab student={student} canEdit={canEdit} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentInfoPanel({
  student,
  gradYear,
  stats,
  band,
  weeks,
  eligibility,
  canEdit,
}: {
  student: ProfileStudent;
  gradYear: number;
  stats: { gpa: string; credits: string };
  band?: Band;
  weeks: number | null;
  eligibility: ProfileEligibilityPayload | null;
  canEdit: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
      <div className="flex flex-col items-center text-center">
        <InitialsAvatar first={student.firstName} last={student.lastName} size={48} />
        <p className="mt-3 font-sans text-[16px] font-semibold text-[var(--text-primary)]">
          {student.firstName} {student.lastName}
        </p>
        <p className="mt-0.5 font-sans text-[13px] text-[var(--text-tertiary)]">{student.sport}</p>
        <p className="font-sans text-[12px] text-[var(--text-tertiary)]">{student.highSchoolName}</p>
        {student.districtName ? (
          <p className="font-sans text-[11px] text-[var(--text-quaternary)]">{student.districtName}</p>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border-default)] pt-4">
        <StatCell label="Grad year" value={String(gradYear)} />
        <StatCell label="Division" value={formatTargetDivision(student.targetDivision)} />
        <StatCell label="GPA" value={stats.gpa} mono />
        <StatCell label="Credits" value={stats.credits} mono />
      </div>

      {weeks != null && weeks <= 4 ? (
        <div className="mt-4 border-t border-[var(--border-default)] pt-4">
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
            Action window
          </p>
          <ActionWindowPill weeks={weeks} />
        </div>
      ) : null}

      {band ? (
        <div className="mt-4 border-t border-[var(--border-default)] pt-4">
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
            Composite band
          </p>
          <BandBadge band={band} />
        </div>
      ) : null}

      {eligibility?.ml ? (
        <div className="mt-4 border-t border-[var(--border-default)] pt-4">
          <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
            ML risk score
          </p>
          <MlCompact ml={eligibility.ml} />
        </div>
      ) : null}

      {canEdit ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border-default)] pt-4">
          <Link
            href={`/students/${student.id}/transcript/new`}
            className="text-center font-sans text-[12px] font-medium text-[var(--olive-600)] hover:underline"
          >
            Add course +
          </Link>
          <Link href={`/students/${student.id}/transcript/ocr`}>
            <Button variant="outline" fullWidth>
              Upload transcript
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function InitialsAvatar({
  first,
  last,
  size = 40,
}: {
  first: string;
  last: string;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-[var(--olive-100)] font-sans text-[14px] font-semibold text-[var(--olive-800)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {studentInitials(first, last)}
    </div>
  );
}

function StatCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md bg-[var(--surface-inner)] px-2 py-2">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[14px] font-semibold text-[var(--text-primary)] ${mono ? "font-mono" : "font-sans"}`}
      >
        {value}
      </p>
    </div>
  );
}

function MlCompact({
  ml,
}: {
  ml: NonNullable<ProfileEligibilityPayload["ml"]>;
}) {
  const pct = (ml.score * 100).toFixed(0);
  const lower = ml.confidence_lower * 100;
  const upper = ml.confidence_upper * 100;
  return (
    <div>
      <p className="font-mono text-[20px] font-semibold text-[var(--text-primary)]">{pct}%</p>
      <p className="font-sans text-[12px] text-[var(--text-secondary)]">
        {mlRiskTierLabel(ml.risk_tier)}
      </p>
      <div
        className="relative mt-2 h-2 rounded-full bg-[var(--surface-inner)]"
        aria-label={`Confidence interval ${lower.toFixed(0)} to ${upper.toFixed(0)} percent`}
      >
        <div
          className="absolute top-0 h-2 rounded-full bg-[var(--olive-600)]"
          style={{ left: `${lower}%`, width: `${Math.max(upper - lower, 2)}%` }}
        />
      </div>
    </div>
  );
}

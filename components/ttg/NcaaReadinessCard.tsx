"use client";

import * as React from "react";
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "@/components/ui/Link";

type NcaaReadinessStudentRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  sport: string;
  grade: number;
  highSchoolName: string;
  targetDivision: string;
  missingItems: string[];
  schoolClearanceStatus: "cleared" | "issue";
};

type Props = {
  summary: {
    requiredStudents: number;
    incompleteStudents: number;
    completedStudents: number;
    clearedSchoolStudents: number;
    notClearedOrUnverifiedSchoolStudents: number;
    mostCommonMissingItem: string | null;
    requiredStudentsList: NcaaReadinessStudentRow[];
    incompleteChecklistStudents: NcaaReadinessStudentRow[];
    completedChecklistStudents: NcaaReadinessStudentRow[];
    schoolClearedStudents: NcaaReadinessStudentRow[];
    schoolIssueStudents: NcaaReadinessStudentRow[];
  };
};

export function NcaaReadinessCard({ summary }: Props) {
  const needsAction = summary.incompleteStudents > 0;
  const [openSection, setOpenSection] = React.useState<
    "required" | "incomplete" | "complete" | "school" | null
  >(summary.incompleteStudents > 0 ? "incomplete" : "required");

  return (
    <Card variant="default" padding="lg" className="mt-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
            NCAA Readiness
          </h2>
          <p className="mt-1 font-sans text-[12px] text-text-tertiary">
            Eligibility Center checklist and school clearance status for grade 11/12 DI/DII pathways.
          </p>
        </div>
        <Badge
          band={needsAction ? "yellow" : "green"}
          icon={needsAction ? AlertTriangle : CheckCircle}
          size="sm"
        >
          {needsAction ? "Action Needed" : "On Track"}
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <DropdownSection
          title="Required students"
          value={summary.requiredStudents}
          open={openSection === "required"}
          onToggle={() =>
            setOpenSection((prev) => (prev === "required" ? null : "required"))
          }
        >
          <StudentList
            rows={summary.requiredStudentsList}
            label="Required"
            band="locked"
          />
        </DropdownSection>

        <DropdownSection
          title="Incomplete checklist"
          value={summary.incompleteStudents}
          open={openSection === "incomplete"}
          onToggle={() =>
            setOpenSection((prev) => (prev === "incomplete" ? null : "incomplete"))
          }
        >
          <StudentList
            rows={summary.incompleteChecklistStudents}
            label="Incomplete"
            band="yellow"
          />
        </DropdownSection>

        <DropdownSection
          title="Complete checklist"
          value={summary.completedStudents}
          open={openSection === "complete"}
          onToggle={() =>
            setOpenSection((prev) => (prev === "complete" ? null : "complete"))
          }
        >
          <StudentList
            rows={summary.completedChecklistStudents}
            label="On Track"
            band="green"
          />
        </DropdownSection>

        <DropdownSection
          title="Cleared school / Not cleared"
          value={`${summary.clearedSchoolStudents} / ${summary.notClearedOrUnverifiedSchoolStudents}`}
          open={openSection === "school"}
          onToggle={() =>
            setOpenSection((prev) => (prev === "school" ? null : "school"))
          }
        >
          <div className="mt-2 grid gap-3 desktop:grid-cols-2 mobile:grid-cols-1">
            <StudentGroup
              title="School issue"
              badgeLabel="School Issue"
              band="red"
              rows={summary.schoolIssueStudents}
            />
            <StudentGroup
              title="School cleared"
              badgeLabel="On Track"
              band="green"
              rows={summary.schoolClearedStudents}
            />
          </div>
        </DropdownSection>
      </div>

      <div className="mt-4 rounded bg-surface-inner px-4 py-3">
        <p className="font-sans text-[12px] text-text-secondary">
          Most common missing item:{" "}
          <span className="font-semibold text-text-primary">
            {summary.mostCommonMissingItem ?? "None"}
          </span>
        </p>
      </div>

    </Card>
  );
}

function DropdownSection({
  title,
  value,
  open,
  onToggle,
  children,
}: {
  title: string;
  value: number | string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded bg-surface-inner p-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
            {title}
          </p>
          <p className="mt-1 font-mono text-[22px] leading-none text-text-primary">
            {value}
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-text-tertiary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-tertiary" />
        )}
      </button>
      {open ? children : null}
    </div>
  );
}

function StudentList({
  rows,
  label,
  band,
}: {
  rows: NcaaReadinessStudentRow[];
  label: string;
  band: "green" | "yellow" | "red" | "locked";
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {rows.length === 0 ? (
        <p className="font-sans text-[12px] text-text-tertiary">
          No students in this bucket.
        </p>
      ) : (
        rows.map((row) => (
          <StudentRow
            key={row.studentId}
            row={row}
            badgeLabel={label}
            band={band}
          />
        ))
      )}
    </div>
  );
}

function StudentGroup({
  title,
  badgeLabel,
  band,
  rows,
}: {
  title: string;
  badgeLabel: string;
  band: "green" | "red";
  rows: NcaaReadinessStudentRow[];
}) {
  return (
    <div>
      <p className="font-sans text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
        {title} ({rows.length})
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="font-sans text-[12px] text-text-tertiary">
            None
          </p>
        ) : (
          rows.map((row) => (
            <StudentRow
              key={row.studentId}
              row={row}
              badgeLabel={badgeLabel}
              band={band}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StudentRow({
  row,
  badgeLabel,
  band,
}: {
  row: NcaaReadinessStudentRow;
  badgeLabel: string;
  band: "green" | "yellow" | "red" | "locked";
}) {
  const missingPreview =
    row.missingItems.length > 2
      ? `${row.missingItems.slice(0, 2).join(", ")} (+${row.missingItems.length - 2} more)`
      : row.missingItems.join(", ");

  return (
    <div className="rounded bg-surface-card px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-sans text-[12px] font-semibold text-text-primary">
            {row.firstName} {row.lastName}
          </p>
          <p className="font-sans text-[11px] text-text-secondary">
            Grade {row.grade} · {row.sport} · {row.highSchoolName}
          </p>
        </div>
        <Badge
          band={band}
          size="sm"
          icon={band === "green" ? CheckCircle : AlertTriangle}
        >
          {badgeLabel}
        </Badge>
      </div>
      {row.missingItems.length > 0 ? (
        <p className="mt-1 font-sans text-[11px] text-text-tertiary">
          Missing: {missingPreview}
        </p>
      ) : null}
      <div className="mt-1">
        <Link href={`/students/${row.studentId}`} icon="arrow" className="text-[11px]">
          Profile
        </Link>
      </div>
    </div>
  );
}

export default NcaaReadinessCard;

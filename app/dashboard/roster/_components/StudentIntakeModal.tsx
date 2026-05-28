"use client";

import * as React from "react";
import { TargetDivision } from "@prisma/client";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui/qn";

export type IntakeSchoolOption = {
  id: string;
  schoolName: string;
  city: string | null;
};

const DIVISION_OPTIONS: Array<{ value: TargetDivision; label: string }> = [
  { value: TargetDivision.DI, label: "NCAA Division I" },
  { value: TargetDivision.DII, label: "NCAA Division II" },
  { value: TargetDivision.DI_or_DII_undecided, label: "DI or DII (undecided)" },
  { value: TargetDivision.DIII, label: "NCAA Division III" },
  { value: TargetDivision.NAIA, label: "NAIA" },
  { value: TargetDivision.Unknown, label: "Not sure yet" },
];

const GRADES = [6, 7, 8, 9, 10, 11, 12] as const;

function defaultEnrollmentDateForGrade(grade: number): string {
  const now = new Date();
  const yearsInHighSchool = Math.max(0, Math.min(6, grade - 8));
  const year9 = now.getFullYear() - yearsInHighSchool;
  return `${year9}-08-15`;
}

export interface StudentIntakeModalProps {
  open: boolean;
  onClose: () => void;
  schools: IntakeSchoolOption[];
  onCreated: () => void;
}

export function StudentIntakeModal({
  open,
  onClose,
  schools,
  onCreated,
}: StudentIntakeModalProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [grade, setGrade] = React.useState(9);
  const [targetDivision, setTargetDivision] = React.useState<TargetDivision>(
    TargetDivision.Unknown
  );
  const [highSchoolId, setHighSchoolId] = React.useState("");
  const [enrollmentDateGrade9, setEnrollmentDateGrade9] = React.useState(() =>
    defaultEnrollmentDateForGrade(9)
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setEnrollmentDateGrade9(defaultEnrollmentDateForGrade(grade));
  }, [grade, open]);

  React.useEffect(() => {
    if (!open) return;
    if (!highSchoolId && schools.length === 1) {
      setHighSchoolId(schools[0]!.id);
    }
  }, [open, schools, highSchoolId]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setGrade(9);
    setTargetDivision(TargetDivision.Unknown);
    setHighSchoolId(schools.length === 1 ? schools[0]!.id : "");
    setEnrollmentDateGrade9(defaultEnrollmentDateForGrade(9));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!highSchoolId) {
      setError("Select a high school.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          grade,
          targetDivision,
          highSchoolId,
          enrollmentDateGrade9,
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(json.error ?? "Could not add student.");
      }

      toast.success("Student added to roster");
      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not add student.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="student-intake-title">
      <div
        aria-hidden
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <div
        className="fixed left-1/2 top-1/2 z-[65] flex max-h-[min(90vh,720px)] w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border-default)] px-5 py-4">
          <div>
            <h2
              id="student-intake-title"
              className="font-serif text-[20px] leading-tight text-[var(--text-primary)]"
            >
              Student intake
            </h2>
            <p className="mt-1 font-sans text-[13px] text-[var(--text-tertiary)]">
              Add a student-athlete to your roster. You can upload a transcript after saving.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--surface-inner)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="qn-no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {schools.length === 0 ? (
              <p className="rounded-md border border-[var(--border-default)] bg-[var(--surface-inner)] px-3 py-2 font-sans text-[13px] text-[var(--text-secondary)]">
                No high schools are configured in the database yet. Ask an administrator to add
                Manteca USD schools before creating students.
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                disabled={submitting || schools.length === 0}
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                disabled={submitting || schools.length === 0}
              />
            </div>

            <label className="block font-sans text-[12px] font-medium text-[var(--text-secondary)]">
              Grade
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                disabled={submitting || schools.length === 0}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 font-sans text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--olive-600)] focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="block font-sans text-[12px] font-medium text-[var(--text-secondary)]">
              Target division
              <select
                value={targetDivision}
                onChange={(e) => setTargetDivision(e.target.value as TargetDivision)}
                disabled={submitting || schools.length === 0}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 font-sans text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--olive-600)] focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]"
              >
                {DIVISION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block font-sans text-[12px] font-medium text-[var(--text-secondary)]">
              High school
              <select
                value={highSchoolId}
                onChange={(e) => setHighSchoolId(e.target.value)}
                required
                disabled={submitting || schools.length === 0}
                className="mt-1 flex h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 font-sans text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--olive-600)] focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]"
              >
                <option value="">Select school…</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.schoolName}
                    {s.city ? ` · ${s.city}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="9th grade enrollment date"
              type="date"
              value={enrollmentDateGrade9}
              onChange={(e) => setEnrollmentDateGrade9(e.target.value)}
              required
              disabled={submitting || schools.length === 0}
            />

            {error ? (
              <p className="font-sans text-[13px] text-[var(--color-red)]" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-default)] px-5 py-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              loading={submitting}
              loadingLabel="Saving…"
              disabled={schools.length === 0}
            >
              Add student
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default StudentIntakeModal;

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

type FormValues = {
  courseName: string;
  gradeLetter: "A" | "B" | "C" | "D" | "F" | "IP";
  term: "fall" | "spring" | "summer";
  academicYear: string;
  termLength: "semester" | "quarter" | "trimester" | "year";
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  courseName: "",
  gradeLetter: "A",
  term: "fall",
  academicYear: "",
  termLength: "semester",
};

export default function TranscriptEntryForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [successToast, setSuccessToast] = React.useState(false);

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    setSubmitting(true);

    const response = await fetch(`/api/students/${studentId}/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 400 && payload?.detail?.fieldErrors) {
        const errors = payload.detail.fieldErrors as Record<string, string[] | undefined>;
        setFieldErrors({
          courseName: errors.courseName?.[0],
          gradeLetter: errors.gradeLetter?.[0],
          term: errors.term?.[0],
          academicYear: errors.academicYear?.[0],
          termLength: errors.termLength?.[0],
        });
      } else {
        setSubmitError(payload?.error ?? "Unable to save transcript entry.");
      }
      setSubmitting(false);
      return;
    }

    setSuccessToast(true);
    setTimeout(() => {
      router.push(`/students/${studentId}#transcript`);
      router.refresh();
    }, 700);
  }

  return (
    <>
      {successToast ? (
        <div className="fixed right-4 top-4 z-50 rounded-md border border-[color:var(--border-default)] bg-surface-elevated px-4 py-3 font-sans text-[13px] text-text-primary shadow-lg">
          Transcript course saved successfully.
        </div>
      ) : null}

      <Card variant="default" padding="lg">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="rounded-md border border-[color:var(--border-default)] bg-surface-inner p-3">
            <p className="font-sans text-[13px] font-semibold text-text-primary">
              This course will be marked as manually entered (Class C data).
            </p>
            <p className="mt-1 font-sans text-[12px] text-text-secondary">
              It will appear in the student's profile and eligibility calculations but will be
              flagged as Provisional in trajectory analysis.
            </p>
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Course name
            </label>
            <input
              required
              value={values.courseName}
              onChange={(event) => updateField("courseName", event.target.value)}
              className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {fieldErrors.courseName ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.courseName}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                Grade letter
              </label>
              <select
                value={values.gradeLetter}
                onChange={(event) =>
                  updateField("gradeLetter", event.target.value as FormValues["gradeLetter"])
                }
                className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="F">F</option>
                <option value="IP">IP</option>
              </select>
              {fieldErrors.gradeLetter ? (
                <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.gradeLetter}</p>
              ) : null}
            </div>

            <div>
              <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                Term
              </label>
              <select
                value={values.term}
                onChange={(event) => updateField("term", event.target.value as FormValues["term"])}
                className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <option value="fall">fall</option>
                <option value="spring">spring</option>
                <option value="summer">summer</option>
              </select>
              {fieldErrors.term ? (
                <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.term}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                Academic year
              </label>
              <input
                required
                placeholder="2024-25"
                value={values.academicYear}
                onChange={(event) => updateField("academicYear", event.target.value)}
                className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
              {fieldErrors.academicYear ? (
                <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.academicYear}</p>
              ) : null}
            </div>

            <div>
              <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                Term length
              </label>
              <select
                value={values.termLength}
                onChange={(event) =>
                  updateField("termLength", event.target.value as FormValues["termLength"])
                }
                className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <option value="semester">semester</option>
                <option value="quarter">quarter</option>
                <option value="trimester">trimester</option>
                <option value="year">year</option>
              </select>
              {fieldErrors.termLength ? (
                <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.termLength}</p>
              ) : null}
            </div>
          </div>

          {submitError ? (
            <p className="font-sans text-[13px] text-band-urgent" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-gold-500 px-4 py-2.5 font-sans text-[13px] font-semibold text-[#1a1f14] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save transcript course"}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}

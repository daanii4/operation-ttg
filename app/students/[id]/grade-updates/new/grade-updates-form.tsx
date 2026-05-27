"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

type CourseOption = {
  id: string;
  courseName: string;
};

type FormValues = {
  course_record_id: string;
  observed_grade: "A" | "B" | "C" | "D" | "F" | "IP";
  observed_at: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0]!;
}

export default function GradeUpdatesForm({
  studentId,
  courses,
}: {
  studentId: string;
  courses: CourseOption[];
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<FormValues>({
    course_record_id: courses[0]?.id ?? "",
    observed_grade: "A",
    observed_at: todayIsoDate(),
  });
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});
    setSubmitting(true);

    const response = await fetch(`/api/students/${studentId}/grade-updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        observed_at: new Date(`${values.observed_at}T00:00:00.000Z`).toISOString(),
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 400 && payload?.detail?.fieldErrors) {
        const errors = payload.detail.fieldErrors as Record<string, string[] | undefined>;
        setFieldErrors({
          course_record_id: errors.course_record_id?.[0],
          observed_grade: errors.observed_grade?.[0],
          observed_at: errors.observed_at?.[0],
        });
      } else {
        setSubmitError(payload?.error ?? "Unable to save grade update.");
      }
      setSubmitting(false);
      return;
    }

    router.push(`/students/${studentId}`);
    router.refresh();
  }

  const hasCourses = courses.length > 0;

  return (
    <Card variant="default" padding="lg">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="rounded-md border border-[color:var(--border-default)] bg-surface-inner p-3">
          <p className="font-sans text-[13px] font-semibold text-text-primary">
            Interim grade observations are Class C data.
          </p>
          <p className="mt-1 font-sans text-[12px] text-text-secondary">
            If any Class C observation exists in the trajectory window, GPA trajectory will be shown
            as Provisional for this student.
          </p>
        </div>

        {!hasCourses ? (
          <p className="font-sans text-[13px] text-text-secondary">
            No course records are available for this student yet.
          </p>
        ) : null}

        <div>
          <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
            Course
          </label>
          <select
            required
            disabled={!hasCourses}
            value={values.course_record_id}
            onChange={(event) => setField("course_record_id", event.target.value)}
            className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseName}
              </option>
            ))}
          </select>
          {fieldErrors.course_record_id ? (
            <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.course_record_id}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Observed grade
            </label>
            <select
              value={values.observed_grade}
              onChange={(event) =>
                setField("observed_grade", event.target.value as FormValues["observed_grade"])
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
            {fieldErrors.observed_grade ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.observed_grade}</p>
            ) : null}
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Date observed
            </label>
            <input
              required
              type="date"
              value={values.observed_at}
              onChange={(event) => setField("observed_at", event.target.value)}
              className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {fieldErrors.observed_at ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.observed_at}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
            Data source class
          </label>
          <input
            readOnly
            value="C (manual entry)"
            className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary"
          />
        </div>

        {submitError ? (
          <p className="font-sans text-[13px] text-band-urgent">{submitError}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !hasCourses}
            className="rounded bg-gold-500 px-4 py-2.5 font-sans text-[13px] font-semibold text-[#1a1f14] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save grade update"}
          </button>
        </div>
      </form>
    </Card>
  );
}

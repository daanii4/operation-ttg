"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

type FormValues = {
  engagement_type:
    | "practice_attendance"
    | "academic_session"
    | "advisor_contact"
    | "team_activity"
    | "self_report_motivation";
  value: number;
  observed_at: string;
  context: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0]!;
}

export default function EngagementForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [values, setValues] = React.useState<FormValues>({
    engagement_type: "practice_attendance",
    value: 1,
    observed_at: todayIsoDate(),
    context: "",
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

    const response = await fetch(`/api/students/${studentId}/engagement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engagement_type: values.engagement_type,
        value: values.value,
        observed_at: new Date(`${values.observed_at}T00:00:00.000Z`).toISOString(),
        context: values.context.trim() ? values.context.trim() : undefined,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 400 && payload?.detail?.fieldErrors) {
        const errors = payload.detail.fieldErrors as Record<string, string[] | undefined>;
        setFieldErrors({
          engagement_type: errors.engagement_type?.[0],
          value: errors.value?.[0],
          observed_at: errors.observed_at?.[0],
          context: errors.context?.[0],
        });
      } else {
        setSubmitError(payload?.error ?? "Unable to save engagement observation.");
      }
      setSubmitting(false);
      return;
    }

    router.push(`/students/${studentId}`);
    router.refresh();
  }

  return (
    <Card variant="default" padding="lg">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="rounded-md border border-[color:var(--border-default)] bg-surface-inner p-3">
          <p className="font-sans text-[13px] font-semibold text-text-primary">
            This engagement observation will be stored as Class C data.
          </p>
          <p className="mt-1 font-sans text-[12px] text-text-secondary">
            Manual observations remain auditable via raw_value and may lower evidence confidence.
          </p>
        </div>

        <div>
          <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
            Engagement type
          </label>
          <select
            value={values.engagement_type}
            onChange={(event) =>
              setField(
                "engagement_type",
                event.target.value as FormValues["engagement_type"]
              )
            }
            className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <option value="practice_attendance">Practice attendance</option>
            <option value="academic_session">Academic session</option>
            <option value="advisor_contact">Advisor contact</option>
            <option value="team_activity">Team activity</option>
            <option value="self_report_motivation">Self-report motivation</option>
          </select>
          {fieldErrors.engagement_type ? (
            <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.engagement_type}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Value (0.00-1.00)
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              required
              value={values.value}
              onChange={(event) => setField("value", Number(event.target.value))}
              className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {fieldErrors.value ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.value}</p>
            ) : null}
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Date observed
            </label>
            <input
              type="date"
              required
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
            Context / notes
          </label>
          <textarea
            rows={4}
            maxLength={500}
            value={values.context}
            onChange={(event) => setField("context", event.target.value)}
            className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          />
          {fieldErrors.context ? (
            <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.context}</p>
          ) : null}
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
            disabled={submitting}
            className="rounded bg-gold-500 px-4 py-2.5 font-sans text-[13px] font-semibold text-[#1a1f14] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save engagement observation"}
          </button>
        </div>
      </form>
    </Card>
  );
}

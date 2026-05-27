"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

type FormValues = {
  social_identity_score: number;
  exclusivity_score: number;
  negative_affectivity_score: number;
  aims_version: "AIMS-2" | "AIMS-3";
  administered_at: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0]!;
}

export default function AimsForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [values, setValues] = React.useState<FormValues>({
    social_identity_score: 0,
    exclusivity_score: 0,
    negative_affectivity_score: 0,
    aims_version: "AIMS-2",
    administered_at: todayIsoDate(),
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

    const response = await fetch(`/api/students/${studentId}/aims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        administered_at: new Date(`${values.administered_at}T00:00:00.000Z`).toISOString(),
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 400 && payload?.detail?.fieldErrors) {
        const errors = payload.detail.fieldErrors as Record<string, string[] | undefined>;
        setFieldErrors({
          social_identity_score: errors.social_identity_score?.[0],
          exclusivity_score: errors.exclusivity_score?.[0],
          negative_affectivity_score: errors.negative_affectivity_score?.[0],
          aims_version: errors.aims_version?.[0],
          administered_at: errors.administered_at?.[0],
        });
      } else {
        setSubmitError(payload?.error ?? "Unable to save AIMS assessment.");
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
            This assessment will be saved as Class C data.
          </p>
          <p className="mt-1 font-sans text-[12px] text-text-secondary">
            AIMS entries from manual input remain visible in risk outputs and may be marked
            provisional depending on evidence context.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Social Identity
            </label>
            <input
              type="number"
              min={0}
              max={70}
              required
              value={values.social_identity_score}
              onChange={(event) => setField("social_identity_score", Number(event.target.value))}
              className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {fieldErrors.social_identity_score ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.social_identity_score}</p>
            ) : null}
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Exclusivity
            </label>
            <input
              type="number"
              min={0}
              max={70}
              required
              value={values.exclusivity_score}
              onChange={(event) => setField("exclusivity_score", Number(event.target.value))}
              className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {fieldErrors.exclusivity_score ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.exclusivity_score}</p>
            ) : null}
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Negative Affectivity
            </label>
            <input
              type="number"
              min={0}
              max={70}
              required
              value={values.negative_affectivity_score}
              onChange={(event) =>
                setField("negative_affectivity_score", Number(event.target.value))
              }
              className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {fieldErrors.negative_affectivity_score ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.negative_affectivity_score}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              AIMS version
            </label>
            <select
              value={values.aims_version}
              onChange={(event) => setField("aims_version", event.target.value as "AIMS-2" | "AIMS-3")}
              className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              <option value="AIMS-2">AIMS-2</option>
              <option value="AIMS-3">AIMS-3</option>
            </select>
            {fieldErrors.aims_version ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.aims_version}</p>
            ) : null}
          </div>

          <div>
            <label className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
              Date administered
            </label>
            <input
              type="date"
              required
              value={values.administered_at}
              onChange={(event) => setField("administered_at", event.target.value)}
              className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {fieldErrors.administered_at ? (
              <p className="mt-1 font-sans text-[12px] text-band-urgent">{fieldErrors.administered_at}</p>
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
            disabled={submitting}
            className="rounded bg-gold-500 px-4 py-2.5 font-sans text-[13px] font-semibold text-[#1a1f14] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save AIMS assessment"}
          </button>
        </div>
      </form>
    </Card>
  );
}

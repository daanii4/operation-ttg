"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, Circle } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

type ChecklistItem = {
  key:
    | "account_created"
    | "ncaa_id_obtained"
    | "official_transcript_sent"
    | "amateurism_questionnaire_completed"
    | "fee_waiver_applied_if_applicable";
  title: string;
  description: string;
};

type ChecklistState = Record<ChecklistItem["key"], boolean>;

type ChecklistApiResponse = {
  studentId: string;
  state: ChecklistState;
  summary: {
    required: boolean;
    completedCount: number;
    totalCount: number;
    incompleteKeys: ChecklistItem["key"][];
    officialReviewBlocked: boolean;
  };
  warning: string | null;
  lastUpdatedAt: string | null;
};

const ITEMS: ChecklistItem[] = [
  {
    key: "account_created",
    title: "Account created",
    description:
      "Student has registered at eligibilitycenter.org with an Academic and Athletics Certification account (required for D1 and D2 competition; $110 for U.S. students).",
  },
  {
    key: "ncaa_id_obtained",
    title: "NCAA ID obtained",
    description: "Unique NCAA ID number received after registration.",
  },
  {
    key: "official_transcript_sent",
    title: "Official transcript sent",
    description:
      "High school has sent official transcript directly to the Eligibility Center; coordinate with school counselor.",
  },
  {
    key: "amateurism_questionnaire_completed",
    title: "Amateurism questionnaire completed",
    description:
      "Completed within the Eligibility Center account (payments, pro exposure, and recruiting activity).",
  },
  {
    key: "fee_waiver_applied_if_applicable",
    title: "Fee waiver applied (if applicable)",
    description:
      "Students who qualify for the federal free lunch program can have the registration fee waived.",
  },
];

function emptyState(): ChecklistState {
  return {
    account_created: false,
    ncaa_id_obtained: false,
    official_transcript_sent: false,
    amateurism_questionnaire_completed: false,
    fee_waiver_applied_if_applicable: false,
  };
}

export function NcaaEligibilityCenterStatus({ studentId }: { studentId: string }) {
  const [data, setData] = React.useState<ChecklistApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<ChecklistItem["key"] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/ncaa-eligibility-checklist`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load checklist");
      const payload = (await res.json()) as ChecklistApiResponse;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checklist");
      setData({
        studentId,
        state: emptyState(),
        summary: {
          required: true,
          completedCount: 0,
          totalCount: ITEMS.length,
          incompleteKeys: ITEMS.map((item) => item.key),
          officialReviewBlocked: true,
        },
        warning:
          "Eligibility Center account incomplete — course calculations cannot be submitted for official review until an account exists.",
        lastUpdatedAt: null,
      });
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function toggleItem(itemKey: ChecklistItem["key"]) {
    if (!data) return;
    const prev = data;
    const nextChecked = !prev.state[itemKey];

    const optimistic: ChecklistApiResponse = {
      ...prev,
      state: { ...prev.state, [itemKey]: nextChecked },
      summary: {
        ...prev.summary,
      },
    };
    setData(optimistic);
    setSavingKey(itemKey);
    setError(null);

    try {
      const res = await fetch(`/api/students/${studentId}/ncaa-eligibility-checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey, checked: nextChecked }),
      });
      if (!res.ok) throw new Error("Failed to save checklist item");
      const payload = (await res.json()) as ChecklistApiResponse;
      setData(payload);
    } catch (err) {
      setData(prev);
      setError(err instanceof Error ? err.message : "Failed to save checklist item");
    } finally {
      setSavingKey(null);
    }
  }

  const summary = data?.summary;

  return (
    <Card variant="default" padding="lg">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-[20px] leading-[1.25] text-text-primary">
            NCAA Eligibility Center Status
          </h2>
          <p className="mt-1 font-sans text-[12px] text-text-tertiary">
            Advisor-verified readiness checklist for official NCAA review submission.
          </p>
        </div>
        {summary ? (
          <Badge
            band={summary.officialReviewBlocked ? "yellow" : "green"}
            icon={summary.officialReviewBlocked ? AlertTriangle : CheckCircle}
            size="sm"
          >
            {summary.completedCount} / {summary.totalCount} complete
          </Badge>
        ) : null}
      </div>

      {data?.warning ? (
        <div className="mb-4 rounded border border-band-support-border bg-band-support-fill px-4 py-3">
          <p className="font-sans text-[12px] font-semibold text-band-support">
            {data.warning}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded border border-escalation/30 bg-escalation-fill px-4 py-3">
          <p className="font-sans text-[12px] text-escalation">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {ITEMS.map((item) => {
          const checked = data?.state[item.key] ?? false;
          return (
            <div
              key={item.key}
              className="rounded bg-surface-inner px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-sans text-[13px] font-semibold text-text-primary">
                    {item.title}
                  </p>
                  <p className="mt-1 font-sans text-[12px] leading-[1.45] text-text-secondary">
                    {item.description}
                  </p>
                </div>
                <Button
                  variant={checked ? "ghost" : "primary"}
                  size="sm"
                  loading={savingKey === item.key}
                  onClick={() => toggleItem(item.key)}
                  className="shrink-0"
                >
                  {checked ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4" />
                      Mark complete
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-3 font-sans text-[11px] text-text-tertiary">Loading checklist...</p>
      ) : data?.lastUpdatedAt ? (
        <p className="mt-3 font-sans text-[11px] text-text-tertiary">
          Last updated {new Date(data.lastUpdatedAt).toLocaleString("en-US")}
        </p>
      ) : null}
    </Card>
  );
}

export default NcaaEligibilityCenterStatus;

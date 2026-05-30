"use client";

import * as React from "react";
import { Check, Pencil, RefreshCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui/qn";
import { thresholdConsequence } from "@/lib/settings/threshold-consequences";
import { SettingsCard, SettingsSectionHeader } from "@/lib/settings/settings-ui";

interface ThresholdRow {
  id: string;
  key: string;
  value: number;
  description: string;
  ticket: string;
  calibratedBy: string | null;
  calibratedAt: string | null;
}

export interface SettingsThresholdsSectionProps {
  canEdit: boolean;
  initialRows: ThresholdRow[];
}

export default function SettingsThresholdsSection({
  canEdit,
  initialRows,
}: SettingsThresholdsSectionProps) {
  const [rows, setRows] = React.useState<ThresholdRow[]>(initialRows);
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [confirmKey, setConfirmKey] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savedKey, setSavedKey] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/settings/thresholds", { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { data: ThresholdRow[] };
      setRows(json.data);
    }
  }, []);

  const beginEdit = (row: ThresholdRow) => {
    if (!canEdit) return;
    setEditingKey(row.key);
    setDraft(String(row.value));
    setConfirmKey(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft("");
    setConfirmKey(null);
  };

  const requestSave = (row: ThresholdRow) => {
    const next = Number(draft);
    if (!Number.isFinite(next)) {
      toast.error("Value must be a number");
      return;
    }
    if (next === row.value) {
      cancelEdit();
      return;
    }
    setConfirmKey(row.key);
  };

  const save = async (row: ThresholdRow) => {
    const next = Number(draft);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/thresholds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: row.key, value: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Save failed (${res.status})`);
      }
      setSavedKey(row.key);
      window.setTimeout(() => setSavedKey(null), 2000);
      await refresh();
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
      setConfirmKey(null);
    }
  };

  return (
    <SettingsCard>
      <SettingsSectionHeader
        title="Thresholds"
        subtitle="Cutoffs that determine risk bands across the platform"
        action={
          <Button variant="ghost" icon={RefreshCcw} onClick={refresh}>
            Refresh
          </Button>
        }
      />

      <div
        role="status"
        className="mt-4 rounded-md border border-[var(--status-support)] bg-[var(--status-support-tint)] px-4 py-3 font-sans text-[12px] leading-4 text-[var(--text-secondary)]"
      >
        Changing these values affects risk bands for all athletes immediately. Only modify with
        verified calibration data.
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-[var(--border-default)]">
        <table className="w-full border-collapse" role="table">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-inner)]">
              <Th>Threshold</Th>
              <Th width={120}>Value</Th>
              <Th>Consequence</Th>
              {canEdit ? <Th width={140} align="right">{""}</Th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isEditing = editingKey === row.key;
              const isDirty =
                isEditing && Number(draft) !== row.value && Number.isFinite(Number(draft));
              const isConfirming = confirmKey === row.key;
              const isSaved = savedKey === row.key;

              return (
                <React.Fragment key={row.id}>
                  <tr
                    className="border-b border-[var(--border-default)]"
                    style={
                      isDirty
                        ? { borderLeft: "3px solid var(--status-support)" }
                        : undefined
                    }
                  >
                    <Td>
                      <span className="font-mono text-[12px] text-[var(--text-primary)]">
                        {row.key}
                      </span>
                      {isDirty ? (
                        <span className="ml-2 inline-flex rounded-full bg-[var(--status-support-tint)] px-2 py-0.5 font-sans text-[10px] font-semibold text-[var(--status-support)]">
                          Unsaved
                        </span>
                      ) : null}
                      {isSaved ? (
                        <span className="ml-2 inline-flex items-center gap-0.5 font-sans text-[11px] text-[var(--status-track)]">
                          <Check size={12} aria-hidden /> Saved
                        </span>
                      ) : null}
                    </Td>
                    <Td>
                      {isEditing ? (
                        <Input
                          aria-label={`${row.key} value`}
                          type="number"
                          step="0.01"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="min-h-[44px] text-[16px]"
                          disabled={!canEdit || saving}
                        />
                      ) : (
                        <span
                          className="font-mono text-[14px] font-semibold text-[var(--text-primary)]"
                          style={{ opacity: canEdit ? 1 : 0.6 }}
                        >
                          {row.value}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-sans text-[12px] text-[var(--text-secondary)]">
                        {thresholdConsequence(row.key, row.description)}
                      </span>
                    </Td>
                    {canEdit ? (
                      <Td align="right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" icon={X} onClick={cancelEdit} disabled={saving}>
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => requestSave(row)}
                              disabled={saving}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" icon={Pencil} onClick={() => beginEdit(row)}>
                            Edit
                          </Button>
                        )}
                      </Td>
                    ) : null}
                  </tr>
                  {isConfirming ? (
                    <tr className="bg-[var(--surface-inner)]">
                      <td colSpan={canEdit ? 4 : 3} className="px-4 py-3">
                        <p className="font-sans text-[13px] text-[var(--text-primary)]">
                          This changes risk bands for all athletes. Save?
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="primary"
                            loading={saving}
                            loadingLabel="Saving…"
                            onClick={() => save(row)}
                          >
                            Save
                          </Button>
                          <Button variant="ghost" onClick={() => setConfirmKey(null)} disabled={saving}>
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </SettingsCard>
  );
}

function Th({
  children,
  width,
  align,
}: {
  children: React.ReactNode;
  width?: number;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className="px-3 py-2 text-left font-sans text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]"
      style={{ width, textAlign: align ?? "left" }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className="min-h-[48px] px-3 py-2 align-middle"
      style={{ textAlign: align ?? "left" }}
    >
      {children}
    </td>
  );
}

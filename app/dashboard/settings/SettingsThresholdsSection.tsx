"use client";

/**
 * Sprint 7 / Workstream T-5 — calibrated thresholds section.
 *
 * Visible to every authenticated user (read-only). Owners get an Edit
 * button on each row that swaps the cell into an inline number input.
 * The warning banner above the table is mandatory per spec — it stays
 * rendered regardless of who's viewing.
 */

import * as React from "react";
import { Pencil, RefreshCcw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui/qn";

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
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/settings/thresholds", { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { data: ThresholdRow[] };
      setRows(json.data);
    }
  }, []);

  const beginEdit = (row: ThresholdRow) => {
    setEditing(row.key);
    setDraft(String(row.value));
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };

  const save = async (row: ThresholdRow) => {
    const next = Number(draft);
    if (!Number.isFinite(next)) {
      toast.error("Value must be a number");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/thresholds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: row.key, value: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `Save failed (${res.status})`);
      }
      toast.success(`Updated ${row.key}`);
      await refresh();
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: 20,
        marginTop: 16,
      }}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <h2
            className="font-serif"
            style={{ fontSize: 18, lineHeight: "24px", color: "var(--color-text)" }}
          >
            Calibrated thresholds
          </h2>
          <p style={{ marginTop: 4, fontSize: 12, color: "var(--color-muted)" }}>
            {canEdit
              ? "Owner-editable knobs that drive F10 / F11 / F12 / ML calculations."
              : "Read-only — only owners can change calibrated values."}
          </p>
        </div>
        <Button variant="ghost" icon={RefreshCcw} onClick={refresh}>
          Refresh
        </Button>
      </div>

      <div
        role="alert"
        style={{
          marginTop: 12,
          padding: "10px 12px",
          background: "var(--color-yellow-tint)",
          border: "1px solid #FDE68A",
          borderRadius: 6,
          fontSize: 12,
          color: "#92400E",
          lineHeight: "16px",
        }}
      >
        Changing these values affects all eligibility calculations immediately.
        Only modify thresholds with verified calibration data from your
        conference. Uncalibrated changes may produce inaccurate eligibility
        signals.
      </div>

      <div
        className="mt-4"
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-row-alt)" }}>
              <Th>Threshold</Th>
              <Th width={140}>Current value</Th>
              <Th>Description</Th>
              <Th width={180}>Ticket</Th>
              <Th width={160}>Last calibrated</Th>
              {canEdit ? <Th width={150} align="right">{""}</Th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isEditing = editing === row.key;
              return (
                <tr
                  key={row.id}
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <Td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--color-text)",
                      }}
                    >
                      {row.key}
                    </span>
                  </Td>
                  <Td>
                    {isEditing ? (
                      <Input
                        aria-label={`${row.key} value`}
                        type="number"
                        step="0.01"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        style={{ height: 32 }}
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          color: "var(--color-text)",
                          fontWeight: 600,
                        }}
                      >
                        {row.value}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--color-text)",
                      }}
                    >
                      {row.description}
                    </span>
                  </Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-muted)",
                      }}
                    >
                      {row.ticket}
                    </span>
                  </Td>
                  <Td>
                    <span
                      style={{ fontSize: 12, color: "var(--color-muted)" }}
                    >
                      {row.calibratedAt
                        ? new Date(row.calibratedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Default"}
                    </span>
                  </Td>
                  {canEdit ? (
                    <Td align="right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            icon={X}
                            onClick={cancelEdit}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            icon={Save}
                            loading={saving}
                            loadingLabel="Saving…"
                            onClick={() => save(row)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          icon={Pencil}
                          onClick={() => beginEdit(row)}
                        >
                          Edit
                        </Button>
                      )}
                    </Td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
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
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-muted)",
        width,
      }}
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
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        fontSize: 13,
        color: "var(--color-text)",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

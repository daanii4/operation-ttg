"use client";

/**
 * Sprint 6 / Workstream B-4 — three-step OCR review flow.
 *
 * Step 1: file drop zone + upload button.
 * Step 2: editable review table with confidence indicators.
 * Step 3: success view with a count of accepted courses.
 *
 * The client polls /api/ocr/[jobId]/status every 2 seconds while the job is
 * processing, then renders the parsed_courses payload for advisor review.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Flag,
  FilePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button, Input } from "@/components/ui/qn";
import type {
  OcrConfidenceSummary,
  ParsedCourse,
} from "@/lib/ocr/types";
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/ocr/types";

type Step = "upload" | "processing" | "review" | "success" | "rejected";

const POLL_MS = 2000;

interface RowDraft extends ParsedCourse {
  rowId: string; // stable React key — UUID generated client-side
  source: "ocr" | "manual"; // manual rows skip the confidence indicator
}

const newRowId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `r-${Math.random().toString(36).slice(2, 10)}`;

export default function OcrUploadClient({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [step, setStep] = React.useState<Step>("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [confidence, setConfidence] = React.useState<OcrConfidenceSummary | null>(
    null
  );
  const [rows, setRows] = React.useState<RowDraft[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [acceptedCount, setAcceptedCount] = React.useState(0);

  const onFileSelected = (next: File | null) => {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_MIME_TYPES.has(next.type)) {
      setError("Unsupported file type. Use PDF, JPEG, PNG, or WebP.");
      return;
    }
    if (next.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `File too large — maximum ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`
      );
      return;
    }
    setFile(next);
  };

  const upload = async () => {
    if (!file) return;
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/students/${studentId}/ocr-transcript`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok && res.status !== 202) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { jobId: string };
      setJobId(data.jobId);
      setStep("processing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Poll the status endpoint while we're processing.
  React.useEffect(() => {
    if (step !== "processing" || !jobId) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/ocr/${jobId}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Status check failed (${res.status})`);
        const data = (await res.json()) as {
          status: string;
          parsed_courses: ParsedCourse[] | null;
          confidence_scores: OcrConfidenceSummary | null;
          error?: string;
        };
        if (data.status === "needs_review" && data.parsed_courses) {
          if (cancelled) return;
          setRows(
            data.parsed_courses.map((c) => ({
              ...c,
              rowId: newRowId(),
              source: "ocr",
            }))
          );
          setConfidence(data.confidence_scores ?? null);
          setStep("review");
          return;
        }
        if (data.status === "failed") {
          if (cancelled) return;
          setError(data.error ?? "OCR failed. Try uploading the transcript again.");
          setStep("upload");
          return;
        }
        if (cancelled) return;
        setTimeout(tick, POLL_MS);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Polling failed");
        setStep("upload");
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [step, jobId]);

  const accept = async () => {
    if (!jobId) return;
    setError(null);
    setSubmitting(true);
    try {
      const courses = rows
        .map((r) => sanitizeRow(r))
        .filter((r): r is NonNullable<ReturnType<typeof sanitizeRow>> => r !== null);
      if (courses.length === 0) {
        setError("Add at least one course with a grade before saving.");
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/ocr/${jobId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `Save failed (${res.status})`);
      }
      const data = (await res.json()) as {
        data: { courseRecordsCreated: number };
      };
      setAcceptedCount(data.data.courseRecordsCreated);
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    if (!jobId) return;
    setError(null);
    setSubmitting(true);
    try {
      await fetch(`/api/ocr/${jobId}/reject`, { method: "POST" });
      setStep("rejected");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discard failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Upload transcript · {studentName}
        </p>
        <h1
          className="font-serif"
          style={{ fontSize: 28, lineHeight: "36px", color: "var(--color-text)", marginTop: 4 }}
        >
          OCR transcript ingestion
        </h1>
        <Stepper step={step} />
      </header>

      {error ? (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            background: "var(--color-red-tint)",
            borderLeft: "3px solid var(--color-red)",
            borderRadius: 6,
            color: "var(--color-red)",
            fontSize: 13,
          }}
        >
          <AlertCircle size={14} aria-hidden style={{ marginRight: 6, verticalAlign: -2 }} />
          {error}
        </div>
      ) : null}

      {step === "upload" || (step === "processing" && !jobId) ? (
        <UploadStep
          file={file}
          onFileSelected={onFileSelected}
          onUpload={upload}
          submitting={submitting}
        />
      ) : null}

      {step === "processing" && jobId ? <ProcessingStep /> : null}

      {step === "review" ? (
        <ReviewStep
          rows={rows}
          setRows={setRows}
          confidence={confidence}
          studentName={studentName}
          onAccept={accept}
          onReject={reject}
          submitting={submitting}
        />
      ) : null}

      {step === "success" ? (
        <SuccessStep
          studentId={studentId}
          studentName={studentName}
          count={acceptedCount}
        />
      ) : null}

      {step === "rejected" ? (
        <div
          role="status"
          style={{
            padding: 32,
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <p
            className="text-base font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            Upload discarded
          </p>
          <p style={{ marginTop: 4, fontSize: 13, color: "var(--color-muted)" }}>
            No course records were saved.
          </p>
          <div className="mt-4">
            <Link
              href={`/students/${studentId}`}
              className="text-[13px] font-medium"
              style={{ color: "var(--color-green)" }}
            >
              ← Back to student profile
            </Link>
          </div>
        </div>
      ) : null}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-views                                                                   */
/* -------------------------------------------------------------------------- */

function Stepper({ step }: { step: Step }) {
  const labels: Array<{ key: Step; label: string }> = [
    { key: "upload", label: "Upload" },
    { key: "review", label: "Review" },
    { key: "success", label: "Save" },
  ];
  const order: Record<Step, number> = {
    upload: 0,
    processing: 0,
    review: 1,
    success: 2,
    rejected: 0,
  };
  const active = order[step];
  return (
    <ol
      role="list"
      className="mt-3 flex items-center gap-3"
      aria-label="Upload progress"
    >
      {labels.map((s, idx) => {
        const isActive = idx === active;
        const isComplete = idx < active;
        const tone = isActive
          ? "var(--color-green)"
          : isComplete
            ? "var(--color-green)"
            : "var(--color-muted)";
        return (
          <React.Fragment key={s.key}>
            <li
              className="flex items-center gap-2"
              style={{ color: tone, fontSize: 12, fontWeight: 600 }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  border: `2px solid ${tone}`,
                  background: isComplete ? tone : "transparent",
                }}
              />
              {s.label}
            </li>
            {idx < labels.length - 1 ? (
              <span
                aria-hidden
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--color-border)",
                  maxWidth: 60,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function UploadStep({
  file,
  onFileSelected,
  onUpload,
  submitting,
}: {
  file: File | null;
  onFileSelected: (f: File | null) => void;
  onUpload: () => void;
  submitting: boolean;
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <section
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: 24,
      }}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files[0];
          if (dropped) onFileSelected(dropped);
        }}
        style={{
          padding: 32,
          borderRadius: 8,
          border: `2px dashed ${
            dragOver ? "var(--color-green)" : "var(--color-border)"
          }`,
          background: dragOver ? "var(--color-green-tint)" : "var(--color-row-alt)",
          textAlign: "center",
          transition: "all 120ms ease-out",
        }}
      >
        <Upload
          size={32}
          aria-hidden
          style={{
            color: dragOver ? "var(--color-green)" : "var(--color-muted)",
            marginInline: "auto",
          }}
        />
        <p
          className="text-base font-semibold"
          style={{ marginTop: 12, color: "var(--color-text)" }}
        >
          Drop a transcript file here
        </p>
        <p
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "var(--color-muted)",
          }}
        >
          PDF, JPEG, PNG, or WebP · max 10 MB
        </p>
        <div className="mt-4 inline-flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          <Button
            variant="outline"
            icon={FilePlus}
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </Button>
          {file ? (
            <span
              style={{ fontSize: 12, color: "var(--color-text)", marginLeft: 8 }}
              aria-live="polite"
            >
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          variant="primary"
          onClick={onUpload}
          disabled={!file || submitting}
          loading={submitting}
          loadingLabel="Uploading…"
          icon={Upload}
        >
          Upload transcript
        </Button>
      </div>
    </section>
  );
}

function ProcessingStep() {
  return (
    <section
      role="status"
      aria-live="polite"
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: 48,
        textAlign: "center",
      }}
    >
      <Loader2
        size={32}
        aria-hidden
        className="animate-spin"
        style={{ color: "var(--color-green)", marginInline: "auto" }}
      />
      <p
        className="text-base font-semibold"
        style={{ marginTop: 12, color: "var(--color-text)" }}
      >
        Reading transcript…
      </p>
      <p style={{ marginTop: 4, fontSize: 12, color: "var(--color-muted)" }}>
        This usually takes 10–30 seconds. We'll surface every course we
        extract for your review before saving anything.
      </p>
    </section>
  );
}

function ReviewStep({
  rows,
  setRows,
  confidence,
  studentName,
  onAccept,
  onReject,
  submitting,
}: {
  rows: RowDraft[];
  setRows: React.Dispatch<React.SetStateAction<RowDraft[]>>;
  confidence: OcrConfidenceSummary | null;
  studentName: string;
  onAccept: () => void;
  onReject: () => void;
  submitting: boolean;
}) {
  const updateRow = (idx: number, patch: Partial<RowDraft>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const removeRow = (idx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        rowId: newRowId(),
        course_name: "",
        grade_letter: null,
        term: null,
        academic_year: null,
        term_length: "semester",
        confidence: 1,
        source: "manual",
      },
    ]);

  return (
    <section
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div
        role="note"
        style={{
          background: "var(--color-yellow-tint)",
          border: "1px solid #FDE68A",
          borderRadius: 6,
          padding: "12px 16px",
          fontSize: 12,
          color: "#92400E",
          lineHeight: "16px",
        }}
      >
        <strong>{studentName}</strong> — these courses will be marked as
        OCR-extracted (Class B data). Class B has higher trust than manual
        entry but lower than a verified data feed. Courses are flagged as
        Provisional in trajectory analysis until a Class A source confirms
        them.
      </div>

      {confidence?.notes ? (
        <p
          style={{
            fontSize: 12,
            color: "var(--color-muted)",
          }}
        >
          Extraction note: {confidence.notes}
        </p>
      ) : null}

      <div
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-row-alt)" }}>
                <Th width={32}>{""}</Th>
                <Th>Course name</Th>
                <Th width={100}>Grade</Th>
                <Th width={120}>Term</Th>
                <Th width={120}>Academic year</Th>
                <Th width={140}>Term length</Th>
                <Th width={48}>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <ReviewRow
                  key={row.rowId}
                  row={row}
                  onChange={(patch) => updateRow(idx, patch)}
                  onRemove={() => removeRow(idx)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button variant="ghost" icon={FilePlus} onClick={addRow}>
            Add row
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="danger"
          onClick={onReject}
          disabled={submitting}
        >
          Discard
        </Button>
        <Button
          variant="primary"
          onClick={onAccept}
          disabled={submitting || rows.length === 0}
          loading={submitting}
          loadingLabel="Saving…"
          icon={CheckCircle2}
        >
          Accept and Save
        </Button>
      </div>
    </section>
  );
}

function ReviewRow({
  row,
  onChange,
  onRemove,
}: {
  row: RowDraft;
  onChange: (patch: Partial<RowDraft>) => void;
  onRemove: () => void;
}) {
  const tone = confidenceTone(row.source === "manual" ? 1 : row.confidence);
  return (
    <tr
      style={{
        borderTop: "1px solid var(--color-border)",
        borderLeft:
          tone.kind === "low"
            ? "4px solid var(--color-yellow)"
            : "4px solid transparent",
      }}
    >
      <Td width={32} align="center">
        <ConfidenceMark tone={tone} />
      </Td>
      <Td>
        <Input
          aria-label="Course name"
          value={row.course_name}
          onChange={(e) => onChange({ course_name: e.target.value })}
          style={{ height: 32 }}
        />
      </Td>
      <Td width={100}>
        <select
          aria-label="Grade"
          value={row.grade_letter ?? ""}
          onChange={(e) =>
            onChange({ grade_letter: (e.target.value || null) as RowDraft["grade_letter"] })
          }
          className="w-full rounded-md border bg-white"
          style={{
            height: 32,
            paddingLeft: 8,
            paddingRight: 8,
            fontSize: 13,
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <option value="">—</option>
          {(["A", "B", "C", "D", "F", "IP"] as const).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Td>
      <Td width={120}>
        <select
          aria-label="Term"
          value={row.term ?? ""}
          onChange={(e) =>
            onChange({ term: (e.target.value || null) as RowDraft["term"] })
          }
          className="w-full rounded-md border bg-white"
          style={{
            height: 32,
            paddingLeft: 8,
            paddingRight: 8,
            fontSize: 13,
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <option value="">—</option>
          {(["fall", "spring", "summer"] as const).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Td>
      <Td width={120}>
        <Input
          aria-label="Academic year"
          placeholder="2023-24"
          value={row.academic_year ?? ""}
          onChange={(e) => onChange({ academic_year: e.target.value || null })}
          style={{ height: 32 }}
        />
      </Td>
      <Td width={140}>
        <select
          aria-label="Term length"
          value={row.term_length ?? "semester"}
          onChange={(e) =>
            onChange({ term_length: e.target.value as RowDraft["term_length"] })
          }
          className="w-full rounded-md border bg-white"
          style={{
            height: 32,
            paddingLeft: 8,
            paddingRight: 8,
            fontSize: 13,
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          {(["semester", "quarter", "trimester", "year"] as const).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Td>
      <Td width={48} align="center">
        <button
          type="button"
          aria-label="Remove row"
          onClick={onRemove}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          style={{ color: "var(--color-muted)" }}
        >
          <Trash2 size={14} aria-hidden />
        </button>
      </Td>
    </tr>
  );
}

function ConfidenceMark({
  tone,
}: {
  tone: { kind: "ok" | "warn" | "low"; pct: number };
}) {
  if (tone.kind === "ok") {
    return (
      <CheckCircle2
        size={16}
        aria-label={`High confidence (${(tone.pct * 100).toFixed(0)}%)`}
        style={{ color: "var(--color-green)" }}
      />
    );
  }
  if (tone.kind === "warn") {
    return (
      <Flag
        size={16}
        aria-label={`Medium confidence (${(tone.pct * 100).toFixed(0)}%)`}
        style={{ color: "var(--color-yellow)" }}
      />
    );
  }
  return (
    <Flag
      size={16}
      aria-label={`Low confidence (${(tone.pct * 100).toFixed(0)}%)`}
      style={{ color: "var(--color-red)" }}
    />
  );
}

function confidenceTone(value: number): {
  kind: "ok" | "warn" | "low";
  pct: number;
} {
  if (value >= 0.85) return { kind: "ok", pct: value };
  if (value >= 0.6) return { kind: "warn", pct: value };
  return { kind: "low", pct: value };
}

function SuccessStep({
  studentId,
  studentName,
  count,
}: {
  studentId: string;
  studentName: string;
  count: number;
}) {
  return (
    <section
      role="status"
      aria-live="polite"
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: 48,
        textAlign: "center",
      }}
    >
      <CheckCircle2
        size={40}
        aria-hidden
        style={{ color: "var(--color-green)", marginInline: "auto" }}
      />
      <p
        className="text-base font-semibold"
        style={{ marginTop: 12, color: "var(--color-text)" }}
      >
        {count} course{count === 1 ? "" : "s"} added to {studentName}'s transcript
      </p>
      <p style={{ marginTop: 4, fontSize: 12, color: "var(--color-muted)" }}>
        Eligibility, A-G, and trajectory recompute on the next dashboard refresh.
      </p>
      <div className="mt-4">
        <Link
          href={`/students/${studentId}`}
          className="text-[13px] font-medium"
          style={{ color: "var(--color-green)" }}
        >
          ← Back to student profile
        </Link>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function sanitizeRow(row: RowDraft): {
  course_name: string;
  grade_letter: "A" | "B" | "C" | "D" | "F" | "IP";
  term: "fall" | "spring" | "summer" | null;
  academic_year: string;
  term_length: "semester" | "quarter" | "trimester" | "year";
} | null {
  if (!row.course_name.trim() || !row.grade_letter) return null;
  if (!row.academic_year || !/^\d{4}-\d{2}$/.test(row.academic_year)) return null;
  return {
    course_name: row.course_name.trim(),
    grade_letter: row.grade_letter,
    term: row.term,
    academic_year: row.academic_year,
    term_length: row.term_length ?? "semester",
  };
}

function Th({
  children,
  width,
}: {
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <th
      scope="col"
      style={{
        textAlign: "left",
        padding: "10px 12px",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-muted)",
        borderBottom: "1px solid var(--color-border)",
        width,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  width,
  align,
}: {
  children: React.ReactNode;
  width?: number;
  align?: "left" | "center";
}) {
  return (
    <td
      style={{
        padding: "10px 12px",
        fontSize: 13,
        color: "var(--color-text)",
        verticalAlign: "middle",
        textAlign: align ?? "left",
        width,
      }}
    >
      {children}
    </td>
  );
}

"use client";

import { useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type ClassificationRow = {
  id: string;
  courseNameDisplay: string;
  academicYear: string;
  ncaaD1Category: string | null;
  agCategory: string | null;
  countsGeometryForNcaa: boolean;
  countsGeometryForAg: boolean;
  countsLabForAg: boolean;
};

type StatusResponse = {
  isStale: boolean;
  daysStale: number;
  totalClassifications: number;
  ncaaClassified: number;
  agClassified: number;
  ncaaPortalUrl: string;
  ucAgListUrl: string;
  lastVerifiedDate: string | null;
};

type SkippedRow = { line: string; reason: string };

export default function SchoolClassificationManager({
  schoolId,
  schoolName,
  initialClassifications,
}: {
  schoolId: string;
  schoolName: string;
  initialClassifications: ClassificationRow[];
}) {
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [ncaaPaste, setNcaaPaste] = useState("");
  const [ucPaste, setUcPaste] = useState("");
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [rows, setRows] = useState(initialClassifications);
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: SkippedRow[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch(`/api/admin/schools/${schoolId}/classification-status`);
    if (res.ok) setStatus(await res.json());
  }, [schoolId]);

  async function runImport(source: "ncaa" | "ucag", pastedText: string) {
    setLoading(true);
    setError(null);
    setImportResult(null);
    try {
      const res = await fetch(
        `/api/admin/schools/${schoolId}/classifications/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, academicYear, pastedText }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setImportResult(data);
      await loadStatus();
      const listRes = await fetch(`/api/schools/${schoolId}/classifications`);
      if (listRes.ok) {
        const list = await listRes.json();
        setRows(
          list.classifications.map((c: ClassificationRow & { id: string }) => ({
            id: c.id,
            courseNameDisplay: c.courseNameDisplay,
            academicYear: c.academicYear,
            ncaaD1Category: c.ncaaD1Category,
            agCategory: c.agCategory,
            countsGeometryForNcaa: c.countsGeometryForNcaa,
            countsGeometryForAg: c.countsGeometryForAg,
            countsLabForAg: c.countsLabForAg,
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(
    classificationId: string,
    field: "countsGeometryForNcaa" | "countsGeometryForAg" | "countsLabForAg",
    value: boolean
  ) {
    const res = await fetch(
      `/api/admin/schools/${schoolId}/classifications/${classificationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      }
    );
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) => (r.id === classificationId ? { ...r, [field]: value } : r))
      );
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-xl text-text-primary">{schoolName}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => loadStatus()}>
          Refresh status
        </Button>
        {status?.isStale && (
          <span className="rounded-sm border border-band-support-border bg-band-support-fill px-2 py-0.5 font-sans text-[11px] text-band-support">Course list may be outdated</span>
        )}
        {status && !status.isStale && status.totalClassifications > 0 && (
          <span className="rounded-sm border border-band-track-border bg-band-track-fill px-2 py-0.5 font-sans text-[11px] text-band-track">Verified</span>
        )}
      </div>

      {status && (
        <Card variant="inner" padding="md">
          <p className="font-mono text-[12px] text-text-secondary">
            {status.totalClassifications} courses · NCAA {status.ncaaClassified} · A-G{" "}
            {status.agClassified} · {status.daysStale}d since last verify
          </p>
          <p className="mt-2 font-sans text-[13px]">
            <a
              href={status.ncaaPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-olive-600 underline"
            >
              NCAA HS Portal
            </a>
            {" · "}
            <a
              href={status.ucAgListUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-olive-600 underline"
            >
              UC A-G list
            </a>
          </p>
        </Card>
      )}

      <Card variant="inner" padding="md">
        <label className="mb-2 block font-sans text-[13px] text-text-secondary">
          Academic year
        </label>
        <input
          className="mb-4 w-40 rounded border border-border px-3 py-2 font-mono text-sm"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
        />

        <div className="grid gap-6 desktop:grid-cols-2">
          <div>
            <label className="mb-1 block font-sans text-[13px] font-medium">
              Paste NCAA HS Portal course table
            </label>
            <textarea
              className="h-40 w-full rounded border border-border p-2 font-mono text-[12px]"
              value={ncaaPaste}
              onChange={(e) => setNcaaPaste(e.target.value)}
            />
            <Button
              className="mt-2"
              disabled={!ncaaPaste.trim()}
              loading={loading}
              onClick={() => runImport("ncaa", ncaaPaste)}
            >
              Import NCAA
            </Button>
          </div>
          <div>
            <label className="mb-1 block font-sans text-[13px] font-medium">
              Paste UC A-G course list
            </label>
            <textarea
              className="h-40 w-full rounded border border-border p-2 font-mono text-[12px]"
              value={ucPaste}
              onChange={(e) => setUcPaste(e.target.value)}
            />
            <Button
              className="mt-2"
              disabled={!ucPaste.trim()}
              loading={loading}
              onClick={() => runImport("ucag", ucPaste)}
            >
              Import UC A-G
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-4 font-sans text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {importResult && (
          <div className="mt-4 font-mono text-[12px] text-text-secondary">
            Imported {importResult.imported}, updated {importResult.updated}, skipped{" "}
            {importResult.skipped?.length ?? 0}
            {importResult.skipped?.length > 0 && (
              <ul className="mt-2 list-disc pl-4">
                {importResult.skipped.map((s, i) => (
                  <li key={i}>
                    {s.reason}: {s.line.slice(0, 80)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card variant="inner" padding="md">
        <h3 className="mb-3 font-sans text-[13px] font-medium">Classifications</h3>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[11px]">
            <thead>
              <tr className="text-left text-text-secondary">
                <th className="pb-2 pr-4">Course</th>
                <th className="pb-2 pr-4">Year</th>
                <th className="pb-2 pr-4">NCAA</th>
                <th className="pb-2 pr-4">A-G</th>
                <th className="pb-2">Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2 pr-4">{r.courseNameDisplay}</td>
                  <td className="py-2 pr-4">{r.academicYear}</td>
                  <td className="py-2 pr-4">{r.ncaaD1Category ?? "—"}</td>
                  <td className="py-2 pr-4">{r.agCategory ?? "—"}</td>
                  <td className="py-2 space-x-2">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={r.countsGeometryForNcaa}
                        onChange={(e) =>
                          toggleFlag(r.id, "countsGeometryForNcaa", e.target.checked)
                        }
                      />
                      geom NCAA
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={r.countsLabForAg}
                        onChange={(e) =>
                          toggleFlag(r.id, "countsLabForAg", e.target.checked)
                        }
                      />
                      lab A-G
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

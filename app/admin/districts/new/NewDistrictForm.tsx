"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type SchoolRow = {
  schoolName: string;
  ceebCode: string;
  ucInstitutionId: string;
  city: string;
};

const emptySchool = (): SchoolRow => ({
  schoolName: "",
  ceebCode: "",
  ucInstitutionId: "",
  city: "",
});

export default function NewDistrictForm() {
  const router = useRouter();
  const [districtName, setDistrictName] = useState("");
  const [state, setState] = useState("CA");
  const [ucDistrictId, setUcDistrictId] = useState("");
  const [schools, setSchools] = useState<SchoolRow[]>([emptySchool()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ districtId: string; schoolCount: number } | null>(
    null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/districts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtName,
          state,
          ucDistrictId: ucDistrictId || undefined,
          schools: schools.filter((s) => s.schoolName && s.ceebCode),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create district");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Card variant="inner" padding="md">
        <p className="font-sans text-sm text-text-primary">
          Created district with {result.schoolCount} school(s).
        </p>
        <p className="mt-2 font-mono text-[12px] text-text-secondary">
          District ID: {result.districtId}
        </p>
        <Button className="mt-4" onClick={() => router.push("/admin/districts/new")}>
          Add another district
        </Button>
        <p className="mt-4 font-sans text-[13px] text-text-secondary">
          Open each school&apos;s classification manager from the school list once schools are
          linked in the database.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="inner" padding="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block font-sans text-[13px] text-text-secondary">
            District name
          </label>
          <input
            required
            className="w-full rounded border border-border px-3 py-2 font-sans text-sm"
            value={districtName}
            onChange={(e) => setDistrictName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-sans text-[13px] text-text-secondary">
              State
            </label>
            <input
              className="w-full rounded border border-border px-3 py-2 font-sans text-sm"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block font-sans text-[13px] text-text-secondary">
              UC district ID (optional)
            </label>
            <input
              className="w-full rounded border border-border px-3 py-2 font-mono text-sm"
              value={ucDistrictId}
              onChange={(e) => setUcDistrictId(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-sans text-[13px] font-medium text-text-primary">Schools</p>
          {schools.map((school, i) => (
            <div key={i} className="grid gap-2 rounded border border-border p-3">
              <input
                placeholder="School name"
                required
                className="rounded border border-border px-3 py-2 font-sans text-sm"
                value={school.schoolName}
                onChange={(e) => {
                  const next = [...schools];
                  next[i] = { ...next[i], schoolName: e.target.value };
                  setSchools(next);
                }}
              />
              <input
                placeholder="CEEB code (6-digit)"
                required
                className="rounded border border-border px-3 py-2 font-mono text-sm"
                value={school.ceebCode}
                onChange={(e) => {
                  const next = [...schools];
                  next[i] = { ...next[i], ceebCode: e.target.value };
                  setSchools(next);
                }}
              />
              <input
                placeholder="UC institution ID (optional)"
                className="rounded border border-border px-3 py-2 font-mono text-sm"
                value={school.ucInstitutionId}
                onChange={(e) => {
                  const next = [...schools];
                  next[i] = { ...next[i], ucInstitutionId: e.target.value };
                  setSchools(next);
                }}
              />
              <input
                placeholder="City (optional)"
                className="rounded border border-border px-3 py-2 font-sans text-sm"
                value={school.city}
                onChange={(e) => {
                  const next = [...schools];
                  next[i] = { ...next[i], city: e.target.value };
                  setSchools(next);
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSchools([...schools, emptySchool()])}
          >
            Add school row
          </Button>
        </div>

        {error && (
          <p className="font-sans text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading}>
          Create district
        </Button>
      </form>
    </Card>
  );
}

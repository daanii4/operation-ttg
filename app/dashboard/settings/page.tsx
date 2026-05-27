import type { Metadata } from "next";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import TtgHeaderActions from "@/components/layout/TtgHeaderActions";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Card from "@/components/ui/Card";
import { getTtgSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Settings · Operation TTG",
};

export default async function SettingsPage() {
  const session = await getTtgSession();
  const isAdmin = session?.role === "ADMIN";

  return (
    <DashboardShell
      eyebrow="SETTINGS"
      pageTitle="Settings"
      pageSubtitle="District seed data · school CEEB codes · advisor account · data source class reference"
      headerActions={<TtgHeaderActions />}
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/" },
          { label: "Manteca USD", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="default" padding="lg">
          <h2 className="font-serif text-[18px] text-text-primary">Districts &amp; schools</h2>
          <p className="mt-1 font-sans text-[12px] text-text-tertiary">
            Provision new districts, register CEEB codes, and import course catalogs (D2).
          </p>
          {isAdmin ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/districts/new"
                className="inline-flex items-center rounded-md border border-[var(--olive-600)] bg-[var(--olive-700)] px-3.5 py-2 font-sans text-[12px] font-semibold text-white transition-colors hover:bg-[var(--olive-800)]"
              >
                Add district
              </Link>
            </div>
          ) : (
            <p className="mt-3 font-sans text-[12px] text-text-tertiary">
              Admin role required to manage districts and schools.
            </p>
          )}
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="font-serif text-[18px] text-text-primary">Advisor account</h2>
          <p className="mt-1 font-sans text-[12px] text-text-tertiary">
            Currently signed in as
          </p>
          <p className="mt-2 font-mono text-[12px] text-text-primary">
            {session?.email ?? session?.userId ?? "—"}
          </p>
          <p className="mt-1 font-sans text-[11px] text-text-tertiary">
            Role: {session?.role ?? "anonymous"}
          </p>
          <p className="mt-3 font-sans text-[12px] text-text-tertiary">
            Multi-advisor team support arrives in Sprint 6.
          </p>
        </Card>

        <Card variant="default" padding="lg" className="md:col-span-2">
          <h2 className="font-serif text-[18px] text-text-primary">Data source class reference</h2>
          <p className="mt-1 font-sans text-[12px] text-text-tertiary">
            Operation TTG records the provenance of every grade and signal so you know
            how much weight to give it.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <SourceClass
              label="Class A"
              description="District-of-record official transcript record (SIS export, signed PDF)."
            />
            <SourceClass
              label="Class B"
              description="District-issued classification or course catalog reference (paste-and-parse)."
            />
            <SourceClass
              label="Class C"
              description="Advisor-entered observation or student self-report (provisional)."
            />
            <SourceClass
              label="Class D"
              description="Inferred or imputed values used only for placeholder display."
            />
          </dl>
        </Card>
      </div>
    </DashboardShell>
  );
}

function SourceClass({ label, description }: { label: string; description: string }) {
  return (
    <div className="rounded bg-surface-inner p-3">
      <dt className="font-mono text-[12px] font-semibold text-text-primary">{label}</dt>
      <dd className="mt-1 font-sans text-[12px] text-text-secondary">{description}</dd>
    </div>
  );
}

import type { Metadata } from "next";
import { Info } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Card from "@/components/ui/Card";
import RoadmapVersionCard, { RoadmapVersion } from "@/components/ttg/RoadmapVersionCard";

export const metadata: Metadata = {
  title: "Product Roadmap · Operation TTG",
};

const ROADMAP: RoadmapVersion[] = [
  {
    version: "v0.1",
    period: "May 2026",
    status: "LIVE",
    statusBand: "green",
    headline: "Manual transcript entry + 10/7 calculator",
    description:
      "F5 (calc_ncaa_10_7_status) deployed with full source citation, deterministic risk banding, advisor-facing cohort dashboard and student profile with transparency layer. Proof-of-concept with Manteca Unified School District demo cohort.",
    ships: [
      "F5 — NCAA D1 10/7 lock-in calculation (Bylaw 14.3)",
      "Cohort dashboard with band distribution chart",
      "Student profile with days-to-lock countdown",
      "Derivation transparency layer on every calculated field",
      "Recommended next-term courses (deterministic, not AI-generated)",
      "A-G / NCAA dual-flag surfacing (D-grade alert)",
    ],
    sources: [
      { label: "NCAA Bylaw 14.3", url: "https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/" },
      { label: "NCAA IE Brochure 2025-26", url: "http://fs.ncaa.org/Docs/eligibility_center/Student_Resources/IE_Brochure.pdf" },
    ],
  },
  {
    version: "v0.2",
    period: "July 2026",
    status: "PLANNED",
    statusBand: "yellow",
    headline: "Full NCAA Eligibility Surface + A-G Tracking",
    description:
      "F1–F4 + F6–F7 deployed. California A-G completion tracking against all seven subject categories. NCAA D1 and D2 GPA calculations. Course list ingestion from NCAA Eligibility Center and CDE A-G course lists. OCR transcript ingestion.",
    ships: [
      "F1 — California A-G completion (UC/CSU)",
      "F2 — A-G GPA calculation",
      "F3 — NCAA D1 16-core completion (geometry rule)",
      "F4 — NCAA D1 GPA (best-16 selection)",
      "F6 — NCAA D2 completion",
      "F7 — NCAA D2 GPA",
      "OCR transcript ingestion (v0.1 was manual entry)",
    ],
    sources: [
      { label: "UC A-G Requirements", url: "https://admission.universityofcalifornia.edu/admission-requirements/first-year-requirements/subject-requirement-a-g.html" },
      { label: "CDE A-G Courses", url: "https://www.cde.ca.gov/ci/gs/hs/hsgrtable.asp" },
      { label: "CSU Admission Requirements", url: "https://www.calstate.edu/apply/freshman/getting_into_the_csu/pages/admission-requirements.aspx" },
    ],
  },
  {
    version: "v1.0",
    period: "Q3 2026",
    status: "PLANNED",
    statusBand: "yellow",
    headline: "Psychometric Layer + Multi-Agent Intelligence",
    description:
      "F8 composite eligibility summary. F9 GPA trajectory. F10 Athletic Identity Measurement Scale (AIMS) with within-subject comparison. F11 engagement. F12 master briefing. Mandatory bias audit (ABROCA + intersectional slicing) before any predictive feature goes live.",
    ships: [
      "F8 — Composite eligibility summary (composes F1–F7)",
      "F9 — GPA trajectory (63-day + 30-day regression)",
      "F10 — AIMS psychometric layer (within-subject thresholds)",
      "F11 — Advisor engagement metrics",
      "F12 — Master briefing with weeks_to_critical_action countdown",
      "Bias audit (ABROCA + intersectional slicing)",
      "Multi-agent architecture: Eligibility, Trajectory, Psychometric, Engagement",
    ],
    sources: [
      { label: "AIMS — Brewer, Van Raalte & Linder (1993)", url: "https://doi.org/10.1177/002188639302900102" },
      { label: "Athletic Identity in Youth (PMC8305814)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8305814/" },
      { label: "Identity Work in Athletes (PMC10611030)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10611030/" },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <DashboardShell
      eyebrow="PRODUCT"
      pageTitle="Roadmap"
      pageSubtitle="What ships in v0.1 today, and what is planned next."
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/dashboard/analytics" },
          { label: "Product Roadmap" },
        ]}
      />

      <div className="mt-6 grid gap-6 mobile:grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3">
        {ROADMAP.map((v) => (
          <RoadmapVersionCard key={v.version} v={v} />
        ))}
      </div>

      <Card variant="inner" padding="md" className="mt-6 rounded">
        <div className="flex items-center gap-3">
          <Info className="h-4 w-4 text-text-secondary" />
          <p className="font-mono text-[12px] text-text-secondary">
            What you see today is v0.1. All other functions are pseudocode only — not running.
          </p>
        </div>
      </Card>
    </DashboardShell>
  );
}

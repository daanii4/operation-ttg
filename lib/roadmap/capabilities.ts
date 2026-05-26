import type { RoadmapPhaseId } from "./types";

export type CapabilityImplementationStatus = "live" | "partial" | "planned";

export type CapabilityProbe = {
  /** Calculation module, API route, or schema artifact */
  implementation?: string[];
  /** UI surface, API consumer, or runtime wiring */
  wiring?: string[];
  /** File must exist and contain the substring (e.g. component import) */
  wiringContains?: { path: string; needle: string }[];
};

export type RoadmapCapability = {
  id: string;
  phaseId: RoadmapPhaseId;
  /** Shown in roadmap “What ships” list */
  label: string;
  detail: string;
  priority: number;
  probe: CapabilityProbe;
  /**
   * Information an agent should collect before implementing or unblocking.
   * Surfaced by `getNextRoadmapFocus()`.
   */
  agentQuestions: string[];
};

/**
 * Ordered registry of product capabilities. Status is resolved at runtime via file probes
 * in `resolve-roadmap.ts` — keep paths aligned with the repo.
 */
export const ROADMAP_CAPABILITIES: RoadmapCapability[] = [
  // ─── v0.1 ─────────────────────────────────────────────────────────────────
  {
    id: "f5-10-7",
    phaseId: "v0.1",
    label: "F5 — NCAA D1 10/7 lock-in (Bylaw 14.3)",
    detail:
      "Deterministic risk bands, AD-1 calendar anchor, AD-3 dual-flag, derivation trace on every field.",
    priority: 10,
    probe: {
      implementation: ["lib/calculations/f5.ts"],
      wiring: ["components/ttg/TenSevenPanel.tsx", "app/students/[id]/StudentProfileClient.tsx"],
    },
    agentQuestions: [],
  },
  {
    id: "cohort-dashboard",
    phaseId: "v0.1",
    label: "Cohort dashboard + roster",
    detail: "Holistic KPI grid, approaching deadlines, NCAA readiness, student roster.",
    priority: 20,
    probe: {
      implementation: ["app/dashboard/analytics/page.tsx", "app/api/cohort/route.ts"],
      wiring: ["app/dashboard/analytics/CohortClient.tsx"],
    },
    agentQuestions: [],
  },
  {
    id: "cohort-band-chart",
    phaseId: "v0.1",
    label: "Band distribution chart",
    detail: "Lock-window histogram by risk band on Analytics, mounted above the student roster.",
    priority: 25,
    probe: {
      implementation: ["components/ttg/DistributionChart.tsx"],
      wiringContains: [
        {
          path: "app/dashboard/analytics/CohortClient.tsx",
          needle: "DistributionChart",
        },
      ],
    },
    agentQuestions: [
      "Should the distribution chart sit above or below the roster on the cohort dashboard?",
    ],
  },
  {
    id: "ncaa-checklist",
    phaseId: "v0.1",
    label: "NCAA Eligibility Center checklist",
    detail: "Five-item checklist with SHA-256 chained audit trail; persisted via Prisma.",
    priority: 30,
    probe: {
      implementation: [
        "lib/eligibility/ncaa-checklist.ts",
        "app/api/students/[id]/ncaa-eligibility-checklist/route.ts",
      ],
      wiring: ["components/ttg/NcaaEligibilityCenterStatus.tsx"],
    },
    agentQuestions: [],
  },
  {
    id: "d2-classification",
    phaseId: "v0.1",
    label: "D2 — Dynamic course classification",
    detail:
      "District/HighSchool/CourseClassification schema, paste-and-parse import, classify-courses service, admin UI.",
    priority: 40,
    probe: {
      implementation: [
        "lib/calculations/classify-courses.ts",
        "prisma/migrations/20260523000000_d2_course_classification/migration.sql",
        "app/api/admin/schools/[id]/classifications/import/route.ts",
      ],
      wiring: ["app/admin/schools/[id]/SchoolClassificationManager.tsx"],
    },
    agentQuestions: [
      "Which schools need NCAA HS Portal + UC A-G paste imports first (CEEB codes verified)?",
      "Is Agent 6 ToS clearance required before enabling automated scraping?",
    ],
  },
  {
    id: "district-seeds",
    phaseId: "v0.1",
    label: "Manteca + Tracy district seeds",
    detail: "District and high-school registry via `npm run seed:districts`.",
    priority: 45,
    probe: {
      implementation: ["scripts/seed-districts.ts", "lib/seed/districts/manteca-usd.ts"],
    },
    agentQuestions: ["Are Tracy USD CEEB codes finalized for all four high schools?"],
  },

  // ─── v0.2 ─────────────────────────────────────────────────────────────────
  {
    id: "f1-f7-calcs",
    phaseId: "v0.2",
    label: "F1–F4 + F6–F7 eligibility calculations",
    detail: "California A-G, NCAA D1/D2 completion and GPA — unit tested, demo-data driven.",
    priority: 50,
    probe: {
      implementation: [
        "lib/calculations/f1.ts",
        "lib/calculations/f2.ts",
        "lib/calculations/f3.ts",
        "lib/calculations/f4.ts",
        "lib/calculations/f6.ts",
        "lib/calculations/f7.ts",
        "lib/eligibility/compute-eligibility.ts",
      ],
    },
    agentQuestions: [],
  },
  {
    id: "eligibility-api",
    phaseId: "v0.2",
    label: "Student eligibility API",
    detail: "GET /api/students/[id]/eligibility — demo cohort only, no auth.",
    priority: 55,
    probe: {
      implementation: ["app/api/students/[id]/eligibility/route.ts"],
    },
    agentQuestions: ["Which auth roles may read eligibility for non-demo students?"],
  },
  {
    id: "eligibility-panels",
    phaseId: "v0.2",
    label: "A-G + NCAA eligibility profile panels",
    detail: "AgCompletionPanel and NcaaEligibilityPanel on student profile.",
    priority: 56,
    probe: {
      implementation: ["components/ttg/AgCompletionPanel.tsx", "components/ttg/NcaaEligibilityPanel.tsx"],
      wiring: ["components/ttg/EligibilityPanels.tsx", "app/students/[id]/StudentProfileClient.tsx"],
    },
    agentQuestions: [],
  },
  {
    id: "auth-supabase",
    phaseId: "v0.2",
    label: "Advisor auth (Supabase)",
    detail: "Email/password sign-in via Supabase Auth; middleware protects dashboard, students, and APIs.",
    priority: 60,
    probe: {
      implementation: [
        "middleware.ts",
        "lib/supabase/server.ts",
        "app/login/page.tsx",
        "app/auth/callback/route.ts",
      ],
      wiring: ["components/auth/SignOutButton.tsx"],
    },
    agentQuestions: [],
  },
  {
    id: "db-cohort-reads",
    phaseId: "v0.2",
    label: "Live Prisma cohort + student reads",
    detail: "Cohort and profiles still use `computeAllDemoResults()` — F5Result table unused.",
    priority: 65,
    probe: {
      implementation: ["lib/data/cohort-from-db.ts"],
    },
    agentQuestions: [
      "Which district/school is the first production cohort to migrate off demo-data?",
      "Is there an existing student import CSV format to support?",
    ],
  },
  {
    id: "manual-transcript-entry",
    phaseId: "v0.2",
    label: "Manual transcript / course entry UI",
    detail: "Courses today only exist in demo seed — no CRUD for advisors.",
    priority: 70,
    probe: {
      implementation: ["app/students/[id]/courses/page.tsx"],
    },
    agentQuestions: [
      "Should course entry be per-student on the profile or bulk CSV import for registrars?",
    ],
  },
  {
    id: "ocr-transcripts",
    phaseId: "v0.2",
    label: "OCR transcript ingestion",
    detail: "PDF upload → structured CourseRecord rows (after manual entry path exists).",
    priority: 80,
    probe: {
      implementation: ["app/api/transcripts/ocr/route.ts"],
    },
    agentQuestions: [
      "Preferred OCR vendor or on-prem requirement?",
      "What transcript layout(s) must v1 support (MUSD official PDF, Parchment, etc.)?",
    ],
  },

  // ─── v1.0 ─────────────────────────────────────────────────────────────────
  {
    id: "f8-composite",
    phaseId: "v1.0",
    label: "F8 — Composite eligibility summary",
    detail: "Compose F1–F7; replace seed-only holistic rollup.",
    priority: 100,
    probe: { implementation: ["lib/calculations/f8.ts"] },
    agentQuestions: ["Confirm tiebreak hierarchy: 10/7 > GPA > completion — any district overrides?"],
  },
  {
    id: "f9-trajectory",
    phaseId: "v1.0",
    label: "F9 — GPA trajectory (63d + 30d regression)",
    detail: "Requires historical term GPA series in DB.",
    priority: 110,
    probe: { implementation: ["lib/calculations/f9.ts"] },
    agentQuestions: ["Minimum terms of history before trajectory bands surface in UI?"],
  },
  {
    id: "f10-aims",
    phaseId: "v1.0",
    label: "F10 — AIMS psychometric layer",
    detail: "Within-subject thresholds; survey ingestion not built.",
    priority: 120,
    probe: { implementation: ["lib/calculations/f10.ts", "lib/psychometric/aims-ingest.ts"] },
    agentQuestions: [
      "Has the AIMS administration protocol been signed off with De'mar?",
      "Is D3 (SD-based thresholds) available yet?",
    ],
  },
  {
    id: "f11-engagement",
    phaseId: "v1.0",
    label: "F11 — Advisor engagement metrics",
    detail: "Session frequency and contact recency — no telemetry pipeline.",
    priority: 130,
    probe: { implementation: ["lib/calculations/f11.ts"] },
    agentQuestions: ["Which engagement events should be captured first (sessions, messages, logins)?"],
  },
  {
    id: "f12-briefing",
    phaseId: "v1.0",
    label: "F12 — Master briefing",
    detail: "weeks_to_critical_action across F8–F11; approaching-deadlines is a partial precursor.",
    priority: 140,
    probe: { implementation: ["lib/calculations/f12.ts"] },
    agentQuestions: ["Which deadline types must appear in the master briefing beyond NCAA 10/7?"],
  },
  {
    id: "bias-audit",
    phaseId: "v1.0",
    label: "Bias audit (ABROCA + intersectional slicing)",
    detail: "Gate before any predictive feature ships.",
    priority: 150,
    probe: { implementation: ["lib/audit/abroca.ts"] },
    agentQuestions: ["Minimum cohort N per slice before audit results are publishable?"],
  },
  {
    id: "multi-agent",
    phaseId: "v1.0",
    label: "Multi-agent architecture (F8–F12 domains)",
    detail: "Eligibility, Trajectory, Psychometric, Engagement agents → F12 composer.",
    priority: 160,
    probe: { implementation: ["lib/agents/orchestrator.ts"] },
    agentQuestions: ["Which LLM provider and data-retention policy applies to advisor-facing agents?"],
  },

  // ─── v2.0 horizon ─────────────────────────────────────────────────────────
  {
    id: "predictive-ml",
    phaseId: "v2.0",
    label: "Predictive ML layer",
    detail: "Ensemble models for dropout / A-G failure — requires v1.0 bias audit.",
    priority: 200,
    probe: { implementation: ["lib/ml/risk-ensemble.ts"] },
    agentQuestions: ["Minimum N and ABROCA thresholds before ML scores appear in advisor UI?"],
  },
  {
    id: "incentive-system",
    phaseId: "v2.0",
    label: "Incentive system (separate data layer)",
    detail: "Token economy — never blended with F11 engagement per data-integrity protocol.",
    priority: 210,
    probe: { implementation: ["lib/incentives/ledger.ts"] },
    agentQuestions: ["Who owns incentive policy design vs engineering implementation?"],
  },
  {
    id: "automated-ingestion",
    phaseId: "v2.0",
    label: "Automated NCAA / A-G portal ingestion",
    detail: "Playwright scaffold; gated on Agent 6 ToS and `D2_AUTOMATED_INGESTION_ENABLED`.",
    priority: 220,
    probe: { implementation: ["lib/ingestion/portal-scraper.ts"] },
    agentQuestions: ["Has Agent 6 completed ToS review for NCAA HS Portal automation?"],
  },
];

"use client";

import { useState } from "react";
import Link from "next/link";

type PhaseStatus = "LIVE" | "IN_BUILD" | "PLANNED" | "HORIZON";

type RoadmapPillar = {
  label: string;
  detail: string;
};

type RoadmapPhase = {
  version: string;
  period: string;
  status: PhaseStatus;
  headline: string;
  description: string;
  pillars: RoadmapPillar[];
  blockers: string[];
  sources: { label: string; url: string }[];
};

const PHASES: RoadmapPhase[] = [
  {
    version: "v0.1",
    period: "May 2026",
    status: "LIVE",
    headline: "Foundation — The Cheat Sheet",
    description:
      "F5 deployed: the NCAA D1 10/7 lock-in calculator with full source citation, deterministic risk banding, and advisor-facing transparency layer. Two-district architecture (Manteca USD + Tracy USD) with dynamic course classification layer replacing hardcoded seed data. 35 unit tests passing. Build is clean on main.",
    pillars: [
      {
        label: "F5 — NCAA D1 10/7 Calculator",
        detail:
          "Bylaw 14.3 — permanent lock of first 10 of 16 core courses at start of senior fall. AD-1 (school calendar anchor), AD-2 (IP exclusion), AD-3 (D-grade dual-flag). Full derivation trace on every field.",
      },
      {
        label: "Cohort Dashboard",
        detail:
          "Band distribution (GREEN / YELLOW / RED / LOCKED), holistic KPI grid, approaching deadlines panel, NCAA readiness summary. All chart data server-computed.",
      },
      {
        label: "Student Profile",
        detail:
          "10/7 panel with days-to-lock countdown, recommended next-term courses (deterministic), fallback pathway on LOCKED state (D2 or JUCO). Derivation modal on every calculated field.",
      },
      {
        label: "D2 — Dynamic Classification Layer",
        detail:
          "CourseClassification table per school. Paste-and-parse importer for NCAA HS Portal and UC A-G CMP. Two-stage course-name normalization with school-specific alias maps. Staleness detection (>365d → provisional). Automated scraping scaffolded and disabled pending legal review.",
      },
      {
        label: "NCAA Eligibility Checklist",
        detail:
          "Five-item checklist with SHA-256 chained event hash audit trail. Persisted to Postgres via Prisma transaction.",
      },
    ],
    blockers: [],
    sources: [
      {
        label: "NCAA Bylaw 14.3",
        url: "https://ncaa.egain.cloud/kb/EligibilityHelp/content/KB-2234/",
      },
      {
        label: "NCAA IE Brochure 2025-26",
        url: "http://fs.ncaa.org/Docs/eligibility_center/Student_Resources/IE_Brochure.pdf",
      },
    ],
  },
  {
    version: "v0.2",
    period: "July 2026",
    status: "IN_BUILD",
    headline: "Full Eligibility Surface — All Three Frameworks",
    description:
      "F1–F4 and F6–F7 bring the complete eligibility picture: California A-G completion and GPA, NCAA D1 and D2 completion and GPA. This is the version where a counselor can open a student profile and see every framework that governs their future — with the same transparency and evidence-tier rigor as F5.",
    pillars: [
      {
        label: "F1 — California A-G Completion",
        detail:
          "Seven subject categories (a–g). C-or-better filter. Structural rules: geometry required in math, lab required in science, same-language required for LOTE. Pre-9th credit for Math and Language only (OQ-F1-1). Credit recovery candidates surfaced per category.",
      },
      {
        label: "F2 — A-G GPA",
        detail:
          "UC methodology: post-9th through summer-after-11th window. 8-semester honors cap applied optimally. R1 (no honors bonus on D/F) and R2 (non-honors retake cannot displace honors D/F) protections enforced. CSU 2.50 and UC effective 3.00 thresholds.",
      },
      {
        label: "F3 — NCAA D1 16-Core Completion",
        detail:
          "Surplus distribution algorithm (EMS overflow → addl_ems → addl_any). Geometry rule enforced separately from year count. Post-graduation single-core exception gated on 8-semester window (OQ-F3-1). D-grade counts (AD-3).",
      },
      {
        label: "F4 — NCAA D1 GPA",
        detail:
          "Best-16 selection favors the student. Reads ncaaApprovedHonors (separate from UC honors list). Three-tier qualifier: FULL_QUALIFIER ≥2.300, ACADEMIC_REDSHIRT 2.000–2.299, NONQUALIFIER <2.000.",
      },
      {
        label: "F6 — NCAA D2 Completion",
        detail:
          "Same 16-core total, different distribution: 3 English, 2 Math, 3 additional EMS. No geometry rule. Primary use case: D1 path closes, D2 path surfaces as viable redirect.",
      },
      {
        label: "F7 — NCAA D2 GPA",
        detail:
          "Two-tier qualifier: FULL_QUALIFIER ≥2.200, PARTIAL_QUALIFIER <2.200. Reads ncaaD2Category. Best-16 same logic as F4.",
      },
      {
        label: "Auth + Real DB Reads",
        detail:
          "next-auth build-out required before any real student data enters the system. Cohort dashboard flips from demo-data.ts to live Prisma reads. CEEB codes replaced with real values from D2 §5 intake.",
      },
      {
        label: "OCR Transcript Ingestion",
        detail:
          "PDF transcript upload → OCR → structured CourseRecord rows. Replaces manual entry for v0.1.",
      },
    ],
    blockers: [
      "CEEB codes for Tracy USD schools must be verified via NCAA HS Portal before course classification imports run",
      "Auth build-out required before any real student PII enters the system",
      "Agent 6 ToS review required before automated portal scraping (Playwright) is enabled — paste-and-parse fallback active",
    ],
    sources: [
      {
        label: "UC A-G Requirements",
        url: "https://admission.universityofcalifornia.edu/admission-requirements/first-year-requirements/subject-requirement-a-g.html",
      },
      {
        label: "UC/CSU Comparison Matrix",
        url: "https://admission.universityofcalifornia.edu/counselors/_files/documents/csu-uc-comparison-matrix.pdf",
      },
      {
        label: "CDE A-G Courses",
        url: "https://www.cde.ca.gov/ci/gs/hs/hsgrtable.asp",
      },
      {
        label: "NCAA IE Brochure 2025-26",
        url: "http://fs.ncaa.org/Docs/eligibility_center/Student_Resources/IE_Brochure.pdf",
      },
    ],
  },
  {
    version: "v1.0",
    period: "Q3 2026",
    status: "PLANNED",
    headline: "Intelligence Layer — Composite Risk + Psychometrics",
    description:
      "F8–F12 bring the platform from eligibility calculator to outcome intelligence system. The composite risk band, GPA trajectory slope, AIMS psychometric layer, and engagement metrics converge in a single master briefing that drives the advisor's weekly action. The multi-agent architecture processes all four signal domains concurrently.",
    pillars: [
      {
        label: "F8 — Composite Eligibility Summary",
        detail:
          "Composes F1–F7. Tiebreak hierarchy: 10/7 > GPA > completion. AD-3 dual-flag elevation. AD-7 stateful D1-closure transition (RED → advisor acknowledgment → YELLOW). ESCALATED band routes to Escalation Review Modal. Factor preservation enforced — composite never hides components.",
      },
      {
        label: "F9 — GPA Trajectory",
        detail:
          "63-day rolling window (9-week quarter). OLS slope with 95% CI. Direction only confirmed when CI does not cross zero — protects against false-positive regression alerts. Regression flag: ≥25% drop. Mixed-source-class downgrade: any unofficial grade in window degrades entire trajectory to Class A (internal only, never exports).",
      },
      {
        label: "F10 — AIMS Psychometric Layer",
        detail:
          "Athletic Identity Measurement Scale — three sub-scales: Social Identity, Exclusivity, Negative Affectivity. Within-subject slope, not absolute thresholds (AD-4). First administration returns baseline only — no bands until N≥2. Four cross-layer flags: exclusivity × GPA decline (→ YELLOW), NA elevation post-injury (→ ESCALATED), all elevated (→ watch), social identity consistent (→ SEL alert). v1.0 ships with 20% delta placeholder; D3 finalizes SD-based thresholds from Brewer et al.",
      },
      {
        label: "F11 — Engagement Metrics",
        detail:
          "Advisor session frequency, contact recency, platform activity per student. Three independent bands. Incentive data is explicitly excluded and analyzed separately — never blended with engagement per data integrity protocol.",
      },
      {
        label: "F12 — Master Briefing",
        detail:
          "Composes F8–F11. weeks_to_critical_action: hard deterministic countdown to the soonest concrete deadline (10/7 lock, A-G summer registration, credit recovery close, marking period close). Driver and source exposed. recommended_intervention_type returns a structured code — Agent A4 translates to prose. AI never generates the recommendation.",
      },
      {
        label: "Multi-Agent Architecture",
        detail:
          "Four concurrent agents: Eligibility (F1–F8), Trajectory (F9), Psychometric (F10), Engagement (F11). Each agent runs independently and posts structured output to F12. No agent can override another's deterministic calculation.",
      },
      {
        label: "Bias Audit — ABROCA + Intersectional Slicing",
        detail:
          "Mandatory before any predictive feature goes live. Area Between ROC Curves across race, gender, grade level, school. Intersectional slicing required. No ML model deploys without documented audit results. Gate cannot be bypassed.",
      },
    ],
    blockers: [
      "AIMS administration protocol must be established with De'mar before F10 can process real assessments",
      "D3 deliverable (risk-band rulebook + AIMS SD-based thresholds from literature) required before F10 threshold config ships",
      "Sufficient real student data required before ABROCA audit is meaningful — minimum N documented in D4",
    ],
    sources: [
      {
        label: "AIMS — Brewer, Van Raalte & Linder (1993)",
        url: "https://doi.org/10.1177/002188639302900102",
      },
      {
        label: "Athletic Identity in Youth (PMC8305814)",
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8305814/",
      },
      {
        label: "Identity Work in Athletes (PMC10611030)",
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10611030/",
      },
    ],
  },
  {
    version: "v2.0",
    period: "Q1 2027",
    status: "HORIZON",
    headline: "Scale — Multi-District Predictive Intelligence",
    description:
      "The platform transitions from a rule-based early-warning system to a predictive outcome engine. Ensemble ML models generate continuous risk probability scores across academic, athletic, and psychosocial domains. Generalizability across districts is enforced through ABROCA-validated model transfer protocols. The incentive system launches as a separate data layer.",
    pillars: [
      {
        label: "Predictive ML Layer",
        detail:
          "Gradient-boosted ensemble models for dropout risk, A-G failure probability, and acute psychosocial crisis likelihood. Continuous 0–1 probability score replaces binary at-risk classification. Requires minimum N documented in D4 and clean ABROCA audit from v1.0.",
      },
      {
        label: "Incentive System",
        detail:
          "Token economy tracking micro-milestone engagement. Maintained in a separate data layer, never blended with outcome metrics or engagement scores per data integrity protocol established in F11. Incentive analysis: stratification variable only, never drives outcome conclusions.",
      },
      {
        label: "Multi-District Generalization",
        detail:
          "Model transfer protocols with district-level recalibration. ABROCA audit required per new district before ML predictions surface in that district's advisor UI. School-specific course-name alias maps and classification data maintained dynamically.",
      },
      {
        label: "Automated Course Classification",
        detail:
          "Playwright-based automated ingestion of NCAA HS Portal and UC A-G CMP (currently scaffolded and disabled). Replaces paste-and-parse for all enrolled schools. Annual refresh cron: February 15 (A-G) and September 1 (NCAA). Requires Agent 6 ToS clearance.",
      },
      {
        label: "Workforce + Legal OS Expansion",
        detail:
          "QuasarNova cross-domain architecture — measurement logic transfers to workforce and legal OS clients. Domain-specific variants inherit from the core metric definitions. Evidence tier criteria consistent across all domains.",
      },
    ],
    blockers: [
      "v1.0 ABROCA audit results required before any ML model enters production",
      "Agent 6 ToS clearance for automated portal scraping",
      "D4 ML-readiness audit must confirm minimum N thresholds per school before predictive layer activates",
    ],
    sources: [
      { label: "Operation TTG Research Paper", url: "/about/roadmap" },
      {
        label: "FERPA 20 U.S.C. § 1232g",
        url: "https://www.law.cornell.edu/uscode/text/20/1232g",
      },
    ],
  },
];

const STATUS_CONFIG: Record<
  PhaseStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  LIVE: {
    label: "LIVE",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    border: "rgba(74,222,128,0.3)",
  },
  IN_BUILD: {
    label: "IN BUILD",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.3)",
  },
  PLANNED: {
    label: "PLANNED",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.3)",
  },
  HORIZON: {
    label: "HORIZON",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.3)",
  },
};

export default function TTGRoadmap() {
  const [openPhase, setOpenPhase] = useState<string | null>(null);
  const [openPillar, setOpenPillar] = useState<Record<string, boolean>>({});

  const togglePhase = (v: string) => setOpenPhase(openPhase === v ? null : v);
  const togglePillar = (v: string, i: number) => {
    const key = `${v}-${i}`;
    setOpenPillar((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
        color: "#e2e8f0",
        padding: 0,
      }}
    >
      <style>{`
        .ttg-roadmap * { box-sizing: border-box; }
        .ttg-roadmap .phase-card {
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          transition: border-color 0.2s ease;
          overflow: hidden;
        }
        .ttg-roadmap .phase-card:hover { border-color: rgba(255,255,255,0.1); }
        .ttg-roadmap .phase-card.active {
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.035);
        }
        .ttg-roadmap .phase-header {
          padding: 28px 32px;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          gap: 24px;
          user-select: none;
        }
        .ttg-roadmap .phase-body { padding: 0 32px 32px; }
        .ttg-roadmap .pillar {
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .ttg-roadmap .pillar:hover { border-color: rgba(255,255,255,0.1); }
        .ttg-roadmap .pillar-header {
          padding: 14px 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          user-select: none;
        }
        .ttg-roadmap .pillar-body {
          padding: 12px 18px 16px;
          font-family: var(--font-sans), 'Geist', sans-serif;
          font-size: 13px;
          line-height: 1.65;
          color: #94a3b8;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .ttg-roadmap .blocker {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(251,113,133,0.06);
          border: 1px solid rgba(251,113,133,0.15);
          border-radius: 6px;
          font-family: var(--font-sans), 'Geist', sans-serif;
          font-size: 12px;
          color: #fca5a5;
          line-height: 1.5;
        }
        .ttg-roadmap .source-link {
          font-family: var(--font-mono), 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s;
        }
        .ttg-roadmap .source-link:hover { color: #94a3b8; }
        .ttg-roadmap .chevron {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
          color: #475569;
        }
        .ttg-roadmap .chevron.open { transform: rotate(180deg); }
        .ttg-roadmap .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
          background: #c9a227;
        }
        @keyframes ttgRoadmapFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ttg-roadmap .fade-in { animation: ttgRoadmapFadeIn 0.2s ease forwards; }
        .ttg-roadmap .back-link {
          font-family: var(--font-mono), 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #64748b;
          text-decoration: none;
          letter-spacing: 0.04em;
        }
        .ttg-roadmap .back-link:hover { color: #c9a227; }
      `}</style>

      <div className="ttg-roadmap">
        <div
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "48px 48px 36px",
          }}
        >
          <Link href="/dashboard/analytics" className="back-link">
            ← Cohort dashboard
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#c9a227",
                  marginBottom: "10px",
                }}
              >
                Operation TTG · QuasarNova LLC
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-serif), 'DM Serif Display', serif",
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: 400,
                  lineHeight: 1.1,
                  color: "#f1f5f9",
                  letterSpacing: "-0.01em",
                }}
              >
                Product Roadmap
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-sans), 'Geist', sans-serif",
                  fontSize: "14px",
                  color: "#64748b",
                  marginTop: "10px",
                  lineHeight: 1.5,
                }}
              >
                From eligibility calculator to outcome intelligence system. Every function
                traces to a documented authority.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {(Object.entries(STATUS_CONFIG) as [PhaseStatus, (typeof STATUS_CONFIG)[PhaseStatus]][]).map(
                ([key, cfg]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      border: `1px solid ${cfg.border}`,
                      borderRadius: "100px",
                      background: cfg.bg,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: cfg.color,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                        fontSize: "10px",
                        fontWeight: 500,
                        color: cfg.color,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "0 48px" }}>
          <div style={{ position: "relative", paddingLeft: "24px", marginTop: "2px" }}>
            <div
              style={{
                position: "absolute",
                left: "7px",
                top: 0,
                bottom: 0,
                width: "1px",
                background:
                  "linear-gradient(to bottom, rgba(201,162,39,0.4), rgba(201,162,39,0.1) 60%, transparent)",
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {PHASES.map((phase, idx) => {
                const cfg = STATUS_CONFIG[phase.status];
                const isOpen = openPhase === phase.version;
                return (
                  <div
                    key={phase.version}
                    style={{
                      position: "relative",
                      paddingBottom: idx < PHASES.length - 1 ? "16px" : "48px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "-24px",
                        top: "36px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: phase.status === "LIVE" ? cfg.color : "#1e293b",
                        border: `2px solid ${cfg.color}`,
                        zIndex: 1,
                        boxShadow:
                          phase.status === "LIVE" ? `0 0 12px ${cfg.color}55` : "none",
                      }}
                    />

                    <div className={`phase-card ${isOpen ? "active" : ""}`}>
                      <div
                        className="phase-header"
                        onClick={() => togglePhase(phase.version)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            togglePhase(phase.version);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                      >
                        <div style={{ minWidth: "80px" }}>
                          <div
                            style={{
                              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                              fontSize: "22px",
                              fontWeight: 600,
                              color: cfg.color,
                              lineHeight: 1,
                            }}
                          >
                            {phase.version}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                              fontSize: "11px",
                              color: "#475569",
                              marginTop: "4px",
                            }}
                          >
                            {phase.period}
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              marginBottom: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              style={{
                                padding: "2px 8px",
                                border: `1px solid ${cfg.border}`,
                                borderRadius: "100px",
                                background: cfg.bg,
                                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                                fontSize: "9px",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                color: cfg.color,
                              }}
                            >
                              {cfg.label}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                                fontSize: "10px",
                                color: "#475569",
                              }}
                            >
                              {phase.pillars.length} features
                            </div>
                          </div>
                          <h2
                            style={{
                              fontFamily: "var(--font-serif), 'DM Serif Display', serif",
                              fontSize: "20px",
                              fontWeight: 400,
                              color: "#f1f5f9",
                              lineHeight: 1.25,
                            }}
                          >
                            {phase.headline}
                          </h2>
                        </div>

                        <svg
                          className={`chevron ${isOpen ? "open" : ""}`}
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden
                        >
                          <path
                            d="M4 6l4 4 4-4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      {isOpen && (
                        <div className="phase-body fade-in">
                          <p
                            style={{
                              fontFamily: "var(--font-sans), 'Geist', sans-serif",
                              fontSize: "14px",
                              color: "#94a3b8",
                              lineHeight: 1.65,
                              marginBottom: "28px",
                              paddingBottom: "24px",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            {phase.description}
                          </p>

                          <div style={{ marginBottom: "24px" }}>
                            <p
                              style={{
                                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                                fontSize: "9px",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "#475569",
                                marginBottom: "12px",
                              }}
                            >
                              What ships
                            </p>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              {phase.pillars.map((pillar, i) => {
                                const pillarKey = `${phase.version}-${i}`;
                                const isPillarOpen = openPillar[pillarKey];
                                return (
                                  <div key={pillarKey} className="pillar">
                                    <div
                                      className="pillar-header"
                                      onClick={() => togglePillar(phase.version, i)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          togglePillar(phase.version, i);
                                        }
                                      }}
                                      role="button"
                                      tabIndex={0}
                                      aria-expanded={isPillarOpen}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          flex: 1,
                                        }}
                                      >
                                        <div className="dot" />
                                        <span
                                          style={{
                                            fontFamily:
                                              "var(--font-mono), 'IBM Plex Mono', monospace",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            color: "#cbd5e1",
                                          }}
                                        >
                                          {pillar.label}
                                        </span>
                                      </div>
                                      <svg
                                        className={`chevron ${isPillarOpen ? "open" : ""}`}
                                        style={{ width: 14, height: 14 }}
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        aria-hidden
                                      >
                                        <path
                                          d="M4 6l4 4 4-4"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </div>
                                    {isPillarOpen && (
                                      <div className="pillar-body fade-in">
                                        {pillar.detail}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {phase.blockers.length > 0 && (
                            <div style={{ marginBottom: "24px" }}>
                              <p
                                style={{
                                  fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                                  fontSize: "9px",
                                  fontWeight: 600,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  color: "#f87171",
                                  marginBottom: "10px",
                                }}
                              >
                                Active blockers
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                }}
                              >
                                {phase.blockers.map((b, i) => (
                                  <div key={i} className="blocker">
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 12 12"
                                      fill="none"
                                      style={{ flexShrink: 0, marginTop: "1px" }}
                                      aria-hidden
                                    >
                                      <circle
                                        cx="6"
                                        cy="6"
                                        r="5.5"
                                        stroke="#f87171"
                                        strokeWidth="1"
                                      />
                                      <path
                                        d="M6 3.5v3M6 8h.01"
                                        stroke="#f87171"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    {b}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <p
                              style={{
                                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                                fontSize: "9px",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "#475569",
                                marginBottom: "8px",
                              }}
                            >
                              Source authority
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                              {phase.sources.map((s) => (
                                <a
                                  key={s.url + s.label}
                                  href={s.url}
                                  target={s.url.startsWith("http") ? "_blank" : undefined}
                                  rel={
                                    s.url.startsWith("http")
                                      ? "noopener noreferrer"
                                      : undefined
                                  }
                                  className="source-link"
                                >
                                  ↗ {s.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "24px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
              fontSize: "11px",
              color: "#334155",
            }}
          >
            Every number must survive a hostile audit by someone whose job is to prove it
            wrong.
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "#1e293b",
            }}
          >
            QuasarNova LLC · Operational Intelligence Division
          </p>
        </div>
      </div>
    </div>
  );
}

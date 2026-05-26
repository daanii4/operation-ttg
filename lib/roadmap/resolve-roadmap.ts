import type { BandKey } from "@/components/ui/Badge";
import { ROADMAP_CAPABILITIES, type RoadmapCapability } from "./capabilities";
import { allRepoFilesExist, repoFileContains } from "./probes";
import type {
  ProductRoadmapSnapshot,
  ResolvedRoadmapItem,
  ResolvedRoadmapPhase,
  RoadmapItemStatus,
  RoadmapNextFocus,
  RoadmapPhaseId,
  RoadmapPhaseStatus,
  RoadmapSource,
} from "./types";

type PhaseDefinition = {
  id: RoadmapPhaseId;
  version: string;
  period: string;
  headline: string;
  description: string;
  blockers: string[];
  sources: RoadmapSource[];
};

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    id: "v0.1",
    version: "v0.1",
    period: "May 2026",
    headline: "Foundation — F5 + D2 + advisor transparency",
    description:
      "NCAA D1 10/7 calculator with full derivation trace, cohort dashboard, student profile transparency, NCAA checklist persistence, and the dynamic course classification layer for Manteca + Tracy USD.",
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
    id: "v0.2",
    version: "v0.2",
    period: "July 2026",
    headline: "Full eligibility surface + production data path",
    description:
      "F1–F7 on the student profile, eligibility API, advisor auth, live database reads, manual course entry, then OCR. Demo cohort remains until auth and DB migration flip.",
    blockers: [
      "CEEB codes for Tracy USD schools must be verified before classification imports",
      "Auth required before real student PII enters the system",
      "Agent 6 ToS review required before automated portal scraping is enabled",
    ],
    sources: [
      {
        label: "UC A-G Requirements",
        url: "https://admission.universityofcalifornia.edu/admission-requirements/first-year-requirements/subject-requirement-a-g.html",
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
    id: "v1.0",
    version: "v1.0",
    period: "Q3 2026",
    headline: "Intelligence layer — composite risk + psychometrics",
    description:
      "F8–F12 compose eligibility, trajectory, AIMS psychometrics, and engagement into a master briefing. Multi-agent architecture and mandatory ABROCA bias audit before predictive features.",
    blockers: [
      "AIMS administration protocol with De'mar before F10 processes real assessments",
      "D3 deliverable (SD-based thresholds) required before F10 config ships",
      "Minimum real-student N required before ABROCA audit is meaningful",
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
    ],
  },
  {
    id: "v2.0",
    version: "v2.0",
    period: "Q1 2027",
    headline: "Scale — multi-district predictive intelligence",
    description:
      "ML risk scores, incentive system (separate data layer), automated classification refresh, and cross-district model transfer with per-district ABROCA gates.",
    blockers: [
      "v1.0 bias audit must pass before any ML scores surface in advisor UI",
      "Agent 6 ToS clearance for automated NCAA / A-G ingestion",
    ],
    sources: [],
  },
];

function resolveCapabilityStatus(cap: RoadmapCapability): RoadmapItemStatus {
  const impl = cap.probe.implementation ?? [];
  const wire = cap.probe.wiring ?? [];
  const wireContains = cap.probe.wiringContains ?? [];

  const hasImpl = impl.length > 0 && allRepoFilesExist(impl);
  const hasWireFiles = wire.length > 0 && allRepoFilesExist(wire);
  const hasWireContains =
    wireContains.length > 0 &&
    wireContains.every((w) => repoFileContains(w.path, w.needle));
  const hasWire = hasWireFiles || hasWireContains;
  const needsWire = wire.length > 0 || wireContains.length > 0;

  if (!hasImpl && !hasWire) return "planned";
  if (hasImpl && (!needsWire || hasWire)) return "live";
  if (hasWire && !hasImpl) return "partial";
  return "partial";
}

function resolvePhaseStatus(
  phaseId: RoadmapPhaseId,
  items: ResolvedRoadmapItem[]
): RoadmapPhaseStatus {
  if (items.length === 0) return phaseId === "v2.0" ? "HORIZON" : "PLANNED";

  const live = items.filter((i) => i.status === "live").length;
  const partial = items.filter((i) => i.status === "partial").length;
  const planned = items.filter((i) => i.status === "planned").length;

  if (phaseId === "v2.0") {
    return live === items.length ? "PLANNED" : "HORIZON";
  }

  if (live === items.length) return "LIVE";
  if (planned === items.length) return "PLANNED";

  if (phaseId === "v0.1" && live > 0 && partial + planned <= 2) {
    return "LIVE";
  }

  return "IN_BUILD";
}

function statusBand(status: RoadmapPhaseStatus): BandKey {
  switch (status) {
    case "LIVE":
      return "green";
    case "IN_BUILD":
      return "yellow";
    case "HORIZON":
      return "locked";
    default:
      return "yellow";
  }
}

function buildPromptForUser(cap: RoadmapCapability, status: RoadmapItemStatus): string {
  const verb =
    status === "planned"
      ? "is the next planned capability"
      : status === "partial"
        ? "is in progress and needs wiring or completion"
        : "needs follow-up";

  const questions =
    cap.agentQuestions.length > 0
      ? ` To proceed, I need: ${cap.agentQuestions.join(" ")}`
      : " Confirm scope and acceptance criteria before implementation.";

  return `${cap.label} ${verb} on the product roadmap.${questions}`;
}

/** Full roadmap snapshot for UI and agents (recomputed on each call). */
export function getProductRoadmapSnapshot(): ProductRoadmapSnapshot {
  const resolvedCaps = ROADMAP_CAPABILITIES.map((cap) => ({
    cap,
    status: resolveCapabilityStatus(cap),
  }));

  const phases: ResolvedRoadmapPhase[] = PHASE_DEFINITIONS.map((def) => {
    const items: ResolvedRoadmapItem[] = resolvedCaps
      .filter(({ cap }) => cap.phaseId === def.id)
      .map(({ cap, status }) => ({
        id: cap.id,
        label: cap.label,
        detail: cap.detail,
        status,
      }));

    const status = resolvePhaseStatus(def.id, items);
    const liveCount = items.filter((i) => i.status === "live").length;
    const partialCount = items.filter((i) => i.status === "partial").length;
    const plannedCount = items.filter((i) => i.status === "planned").length;

    const blockers =
      status === "IN_BUILD" || (def.id === "v0.2" && partialCount > 0)
        ? def.blockers
        : def.id === "v2.0"
          ? def.blockers
          : status === "PLANNED" || status === "HORIZON"
            ? def.blockers
            : [];

    return {
      id: def.id,
      version: def.version,
      period: def.period,
      status,
      statusBand: statusBand(status),
      headline: def.headline,
      description: def.description,
      items,
      blockers,
      sources: def.sources,
      liveCount,
      partialCount,
      plannedCount,
    };
  });

  const next = getNextRoadmapFocusFromResolved(resolvedCaps, phases);

  const inBuild = phases.find((p) => p.status === "IN_BUILD");
  const summary = inBuild
    ? `Current focus: ${inBuild.version} (${inBuild.liveCount} live, ${inBuild.partialCount} partial, ${inBuild.plannedCount} planned).`
    : `Latest live phase: ${phases.filter((p) => p.status === "LIVE").pop()?.version ?? "none"}.`;

  return {
    generatedAt: new Date().toISOString(),
    phases,
    next,
    summary,
  };
}

function getNextRoadmapFocusFromResolved(
  resolvedCaps: { cap: RoadmapCapability; status: RoadmapItemStatus }[],
  phases: ResolvedRoadmapPhase[]
): RoadmapNextFocus | null {
  const pending = resolvedCaps
    .filter(({ status }) => status !== "live")
    .sort((a, b) => a.cap.priority - b.cap.priority);

  if (pending.length === 0) return null;

  const { cap, status } = pending[0]!;
  const phase = phases.find((p) => p.id === cap.phaseId)!;

  return {
    capabilityId: cap.id,
    label: cap.label,
    detail: cap.detail,
    status,
    phaseId: cap.phaseId,
    phaseVersion: phase.version,
    phaseStatus: phase.status,
    priority: cap.priority,
    blockers: phase.blockers,
    agentQuestions: cap.agentQuestions,
    promptForUser: buildPromptForUser(cap, status),
  };
}

/**
 * Returns the highest-priority capability that is not fully live.
 * Use this when the user asks “what’s next on the product roadmap?”
 */
export function getNextRoadmapFocus(): RoadmapNextFocus | null {
  return getProductRoadmapSnapshot().next;
}

/** Maps resolved phases to the legacy card shape used by RoadmapVersionCard. */
export function toRoadmapVersionCards(phases: ResolvedRoadmapPhase[]) {
  return phases.map((p) => ({
    version: p.version,
    period: p.period,
    status: p.status,
    statusBand: p.statusBand,
    headline: p.headline,
    description: p.description,
    ships: p.items.map((i) => ({
      id: i.id,
      label: i.label,
      detail: i.detail,
      status: i.status,
    })),
    blockers: p.blockers,
    sources: p.sources,
    progress: {
      live: p.liveCount,
      partial: p.partialCount,
      planned: p.plannedCount,
      total: p.items.length,
    },
  }));
}

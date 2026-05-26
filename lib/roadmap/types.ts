import type { BandKey } from "@/components/ui/Badge";

export type RoadmapPhaseId = "v0.1" | "v0.2" | "v1.0" | "v2.0";

export type RoadmapPhaseStatus = "LIVE" | "IN_BUILD" | "PLANNED" | "HORIZON";

export type RoadmapItemStatus = "live" | "partial" | "planned";

export type RoadmapSource = { label: string; url: string };

export type ResolvedRoadmapItem = {
  id: string;
  label: string;
  detail: string;
  status: RoadmapItemStatus;
};

export type ResolvedRoadmapPhase = {
  id: RoadmapPhaseId;
  version: string;
  period: string;
  status: RoadmapPhaseStatus;
  statusBand: BandKey;
  headline: string;
  description: string;
  items: ResolvedRoadmapItem[];
  blockers: string[];
  sources: RoadmapSource[];
  liveCount: number;
  partialCount: number;
  plannedCount: number;
};

export type RoadmapNextFocus = {
  capabilityId: string;
  label: string;
  detail: string;
  status: RoadmapItemStatus;
  phaseId: RoadmapPhaseId;
  phaseVersion: string;
  phaseStatus: RoadmapPhaseStatus;
  priority: number;
  blockers: string[];
  agentQuestions: string[];
  /** Plain-language prompt for the user when scoping the next slice of work */
  promptForUser: string;
};

export type ProductRoadmapSnapshot = {
  generatedAt: string;
  phases: ResolvedRoadmapPhase[];
  next: RoadmapNextFocus | null;
  summary: string;
};

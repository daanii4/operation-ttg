import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CheckCircle,
  Hammer,
  Telescope,
} from "lucide-react";
import type { BandKey } from "@/components/ui/Badge";
import type { RoadmapItemStatus, RoadmapPhaseStatus } from "./types";

/** Visible on the roadmap page — band colors here mean build status, not athlete risk. */
export const ROADMAP_STATUS_CAPTION =
  "Color here reflects build status, not athlete risk.";

export const PHASE_BUILD_LABEL: Record<RoadmapPhaseStatus, string> = {
  LIVE: "Live",
  IN_BUILD: "In build",
  PLANNED: "Planned",
  HORIZON: "Horizon",
};

export const ITEM_BUILD_LABEL: Record<RoadmapItemStatus, string> = {
  live: "Live",
  partial: "Partial",
  planned: "Planned",
};

export function phaseStatusBand(status: RoadmapPhaseStatus): BandKey {
  switch (status) {
    case "LIVE":
      return "green";
    case "IN_BUILD":
    case "PLANNED":
      return "yellow";
    case "HORIZON":
      return "locked";
    default:
      return "yellow";
  }
}

export function phaseStatusIcon(status: RoadmapPhaseStatus): LucideIcon {
  switch (status) {
    case "LIVE":
      return CheckCircle;
    case "IN_BUILD":
      return Hammer;
    case "HORIZON":
      return Telescope;
    case "PLANNED":
    default:
      return Calendar;
  }
}

/** Left accent + progress segment tokens (Build 01 band spine, build domain). */
export function phaseAccentColor(status: RoadmapPhaseStatus): string {
  switch (status) {
    case "LIVE":
      return "var(--band-track)";
    case "IN_BUILD":
    case "PLANNED":
      return "var(--band-support)";
    case "HORIZON":
      return "var(--color-escalated)";
    default:
      return "var(--band-support)";
  }
}

export function itemDotColor(status: RoadmapItemStatus): string {
  switch (status) {
    case "live":
      return "var(--band-track)";
    case "partial":
      return "var(--band-support)";
    case "planned":
    default:
      return "var(--text-tertiary)";
  }
}

export function itemStatusBand(status: RoadmapItemStatus): BandKey {
  switch (status) {
    case "live":
      return "green";
    case "partial":
      return "yellow";
    case "planned":
    default:
      return "locked";
  }
}

export function nextFocusItemBand(status: RoadmapItemStatus): BandKey {
  return itemStatusBand(status);
}

export function nextFocusItemLabel(status: RoadmapItemStatus): string {
  return ITEM_BUILD_LABEL[status];
}

export function progressAriaLabel(
  version: string,
  live: number,
  partial: number,
  planned: number,
  total: number
): string {
  return `${version}: ${live} of ${total} capabilities live, ${partial} partial, ${planned} planned`;
}

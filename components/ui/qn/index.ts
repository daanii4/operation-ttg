/**
 * QuasarNova v1 component library — barrel export.
 *
 * Imports throughout the Roster + Briefings tabs prefer
 *   import { BandBadge, Button } from "@/components/ui/qn";
 * over deep paths so we can reorganize internals without churning callers.
 */

export { BandBadge, type Band, type BandBadgeProps } from "./BandBadge";
export { ActionWindowPill, type ActionWindowPillProps } from "./ActionWindowPill";
export {
  EvidenceTierChip,
  type EvidenceTier,
  type EvidenceTierChipProps,
} from "./EvidenceTierChip";
export { Button, type ButtonProps, type ButtonVariant } from "./Button";
export { Input, type InputProps } from "./Input";
export {
  FilterChip,
  UtilityFilterChip,
  type FilterChipProps,
  type UtilityFilterChipProps,
} from "./FilterChip";
export {
  Skeleton,
  SkeletonRow,
  SkeletonCard,
  SkeletonCardRow,
  type SkeletonProps,
} from "./Skeleton";

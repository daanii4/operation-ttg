import Badge, { type BandKey } from "@/components/ui/Badge";
import type { LucideIcon } from "lucide-react";

type RoadmapBuildStatusBadgeProps = {
  band: BandKey;
  label: string;
  icon: LucideIcon;
  size?: "sm" | "md";
  className?: string;
};

/** Build-domain status badge — icon + text label, never color alone. */
export function RoadmapBuildStatusBadge({
  band,
  label,
  icon,
  size = "md",
  className = "",
}: RoadmapBuildStatusBadgeProps) {
  return (
    <Badge band={band} size={size} icon={icon} className={className}>
      {label}
    </Badge>
  );
}

export default RoadmapBuildStatusBadge;

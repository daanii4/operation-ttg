import * as React from "react";
import type { LucideIcon } from "lucide-react";

export type BandKey = "green" | "yellow" | "red" | "locked" | "escalation";

type BadgeProps = {
  band: BandKey;
  icon: LucideIcon;
  variant?: "default" | "inverse" | "outline";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
};

const BAND_DEFAULT: Record<BandKey, { fill: string; border: string; text: string }> = {
  green:      { fill: "bg-band-track-fill",   border: "border-band-track-border",   text: "text-band-track" },
  yellow:     { fill: "bg-band-support-fill", border: "border-band-support-border", text: "text-band-support" },
  red:        { fill: "bg-band-urgent-fill",  border: "border-band-urgent-border",  text: "text-band-urgent" },
  locked:     { fill: "bg-band-pivot-fill",   border: "border-band-pivot-border",   text: "text-band-pivot" },
  escalation: { fill: "bg-escalation-fill",   border: "border-escalation/30",       text: "text-escalation" },
};

const BAND_TOKEN: Record<BandKey, string> = {
  green:      "var(--band-track)",
  yellow:     "var(--band-support)",
  red:        "var(--band-urgent)",
  locked:     "var(--band-pivot)",
  escalation: "var(--color-escalation)",
};

export function Badge({
  band,
  icon: Icon,
  variant = "default",
  size = "sm",
  className = "",
  children,
}: BadgeProps) {
  const sizing =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[11px]";

  if (variant === "default") {
    const s = BAND_DEFAULT[band];
    return (
      <span
        className={[
          "inline-flex items-center gap-1 rounded-sm border font-sans font-semibold uppercase tracking-[0.04em]",
          sizing,
          s.fill,
          s.border,
          s.text,
          className,
        ].join(" ")}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {children}
      </span>
    );
  }

  if (variant === "inverse") {
    const c = BAND_TOKEN[band];
    return (
      <span
        className={[
          "inline-flex items-center gap-1 rounded-sm border font-serif text-[13px] text-white px-3 py-1",
          className,
        ].join(" ")}
        style={{
          backgroundColor: `color-mix(in srgb, ${c} 20%, transparent)`,
          borderColor: `color-mix(in srgb, ${c} 60%, transparent)`,
        }}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {children}
      </span>
    );
  }

  // outline
  const c = BAND_TOKEN[band];
  return (
    <span
      className={[
        "inline-flex items-center rounded-sm border bg-transparent font-mono uppercase tracking-[0.08em] text-[9px] px-1.5 py-0.5",
        className,
      ].join(" ")}
      style={{ color: c, borderColor: `color-mix(in srgb, ${c} 60%, transparent)` }}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      {children}
    </span>
  );
}

export default Badge;

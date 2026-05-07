import * as React from "react";

type CardVariant = "default" | "inner" | "inverse" | "alert-yellow" | "alert-red";
type CardPadding = "none" | "sm" | "md" | "lg";
type CardRadius = "default" | "lg" | "xl";

type CardProps = {
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const PAD: Record<CardPadding, string> = {
  none: "p-0",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-6",
};

const RAD: Record<CardRadius, string> = {
  default: "rounded",
  lg:      "rounded-lg",
  xl:      "rounded-xl",
};

const VARIANT: Record<CardVariant, string> = {
  default:        "bg-surface-card shadow-sm",
  inner:          "bg-surface-inner",
  inverse:        "bg-surface-inverse text-white",
  "alert-yellow": "bg-band-yellow-fill border border-band-yellow-border",
  "alert-red":    "bg-escalation-fill border border-escalation/30",
};

export function Card({
  variant = "default",
  padding = "lg",
  radius = "default",
  className = "",
  style,
  children,
}: CardProps) {
  return (
    <div
      className={[VARIANT[variant], PAD[padding], RAD[radius], className].join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}

export default Card;

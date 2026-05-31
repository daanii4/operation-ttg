"use client";

import * as React from "react";

export interface DerivationTriggerProps {
  children: React.ReactNode;
  onClick: () => void;
  /** Accessible name when children are numeric only */
  ariaLabel: string;
  className?: string;
}

/**
 * Affordance for values backed by calc-layer derivations (gold underline on hover).
 */
export function DerivationTrigger({
  children,
  onClick,
  ariaLabel,
  className,
}: DerivationTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      className={[
        "cursor-pointer rounded-sm text-left transition-[text-decoration-color,text-decoration-thickness] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        "hover:underline hover:[text-decoration-thickness:2px] hover:[text-underline-offset:4px] hover:[text-decoration-color:var(--gold-500)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--olive-600)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

export default DerivationTrigger;

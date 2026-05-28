/**
 * QuasarNova v1 — §1.4 Button
 *
 * Variants: primary | outline | ghost | danger.
 * • Height fixed at 36px, padding 0/14px, radius 6px.
 * • Loading state replaces the leading icon with a spinner and locks button
 *   width via `min-width` so the layout doesn't shift mid-async.
 * • Focus ring is the design-system green at 2px / offset 2px.
 *
 * The button accepts a normal `children` for label and an optional `icon`
 * prop for a leading Lucide icon. When `loading=true`, the icon is replaced
 * by a Loader2 spinner.
 */

"use client";

import * as React from "react";
import { Loader2, type LucideIcon } from "lucide-react";

export type ButtonVariant = "primary" | "gold" | "outline" | "ghost" | "danger";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  iconPosition?: "leading" | "trailing";
  loading?: boolean;
  /** Label override during loading state. Default keeps the resting label. */
  loadingLabel?: string;
  /** Render as a non-interactive element styled like the button. */
  asLink?: false;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "qn-btn-primary text-white border border-transparent " +
    "bg-[var(--olive-600)] hover:bg-[var(--olive-700)] active:bg-[var(--olive-800)]",
  gold:
    "qn-btn-gold border border-transparent text-[#1e2b12] " +
    "bg-[var(--gold-500)] hover:bg-[#c4911e] active:scale-[0.98]",
  outline:
    "qn-btn-outline border bg-[var(--surface-card)] text-[var(--text-primary)] " +
    "border-[var(--border-default)] hover:bg-[var(--surface-inner)] active:bg-[var(--surface-inner)]",
  ghost:
    "qn-btn-ghost border border-transparent bg-transparent text-[var(--text-primary)] " +
    "hover:bg-[var(--surface-inner)] active:bg-[var(--surface-inner)]",
  danger:
    "qn-btn-danger border bg-[var(--surface-card)] text-[var(--color-red)] " +
    "border-[var(--color-red)] hover:bg-[var(--color-red-tint)] active:bg-[#FEE2E2]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "outline",
      icon: Icon,
      iconPosition = "leading",
      loading = false,
      loadingLabel,
      disabled,
      children,
      className,
      type = "button",
      fullWidth,
      style,
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          "inline-flex select-none items-center justify-center gap-2 rounded-md",
          "text-[13px] font-medium leading-none",
          "transition-colors duration-[120ms] ease-out",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-[var(--olive-600)]",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
          fullWidth ? "w-full" : "",
          VARIANT_CLASSES[variant],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ height: 36, paddingLeft: 14, paddingRight: 14, ...style }}
        {...rest}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : Icon && iconPosition === "leading" ? (
          <Icon size={16} aria-hidden />
        ) : null}
        <span>{loading && loadingLabel ? loadingLabel : children}</span>
        {!loading && Icon && iconPosition === "trailing" ? (
          <Icon size={16} aria-hidden />
        ) : null}
      </button>
    );
  }
);

export default Button;

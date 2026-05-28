/**
 * QuasarNova v1 — §1.5 Input
 *
 * Standard text input. Optional leading icon. Optional inline error message.
 * Mobile callers should pass `mobile` so the height bumps to 44px and the
 * font-size is set to 16px (prevents iOS zoom on focus).
 */

"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  /** Inline error text rendered below the input (12px / red). */
  error?: string | null;
  /** Display-only label rendered above the input. */
  label?: string;
  /** Bumps height to 44 + 16px font for mobile (prevents iOS zoom). */
  mobile?: boolean;
  /** Pill-shaped input used by the mobile search bar (§3.3). */
  pill?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      icon: Icon,
      error,
      label,
      mobile,
      pill,
      className,
      id,
      style: styleProp,
      ...rest
    },
    ref
  ) {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const errorId = error ? `${inputId}-error` : undefined;

    const iconPad = Icon ? (mobile ? 44 : 40) : 12;

    return (
      <div className="flex w-full flex-col gap-1">
        {label ? (
          <label
            htmlFor={inputId}
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]"
          >
            {label}
          </label>
        ) : null}
        <div className="relative w-full">
          {Icon ? (
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex w-5 items-center justify-center"
              aria-hidden
            >
              <Icon size={16} className="text-[var(--text-quaternary)]" />
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={[
              "block w-full bg-[var(--surface-card)] outline-none transition-colors duration-[120ms]",
              "placeholder:text-[var(--text-quaternary)]",
              "border focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]",
              error
                ? "border-[var(--color-red)] focus:border-[var(--color-red)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]"
                : "border-[var(--border-default)] hover:border-[var(--border-hover)] focus:border-[var(--olive-600)]",
              pill ? "rounded-full" : "rounded-md",
              "disabled:bg-[var(--surface-inner)] disabled:text-[var(--text-tertiary)]",
              "text-[var(--text-primary)]",
              className ?? "",
            ].join(" ")}
            style={{
              height: mobile ? 44 : 36,
              paddingLeft: iconPad,
              paddingRight: 12,
              fontSize: mobile ? 16 : 13,
              ...styleProp,
            }}
            {...rest}
          />
        </div>
        {error ? (
          <p
            id={errorId}
            className="text-[12px] leading-4 text-[var(--color-red)]"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

export default Input;

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
    { icon: Icon, error, label, mobile, pill, className, id, ...rest },
    ref
  ) {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex w-full flex-col gap-1">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: "var(--color-muted)" }}
          >
            {label}
          </label>
        ) : null}
        <div className="relative w-full">
          {Icon ? (
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center"
              aria-hidden
            >
              <Icon size={16} style={{ color: "var(--color-muted)" }} />
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={[
              "block w-full bg-white outline-none transition-colors duration-[120ms]",
              "placeholder:text-[#9CA3AF]",
              "border focus:shadow-[0_0_0_3px_var(--color-focus-ring)]",
              error
                ? "border-[var(--color-red)] focus:border-[var(--color-red)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-green)]",
              pill ? "rounded-full" : "rounded-md",
              "disabled:bg-[#F9FAFB] disabled:text-[var(--color-muted)]",
              "text-[var(--color-text)]",
              className ?? "",
            ].join(" ")}
            style={{
              height: mobile ? 44 : 36,
              paddingLeft: Icon ? 36 : 12,
              paddingRight: 12,
              fontSize: mobile ? 16 : 13,
            }}
            {...rest}
          />
        </div>
        {error ? (
          <p
            id={errorId}
            className="text-[12px] leading-4"
            style={{ color: "var(--color-red)" }}
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

export default Input;

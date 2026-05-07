"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";

type ButtonProps = {
  variant?: "primary" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  loading,
  type = "button",
  className = "",
  onClick,
  children,
}: ButtonProps) {
  const sz = size === "md" ? "px-4 py-2" : "px-3 py-1.5";
  const base =
    "inline-flex items-center justify-center gap-2 rounded font-sans text-[13px] font-medium transition-all duration-150 ease-out focus-ring";
  const variantCls =
    variant === "primary"
      ? "bg-olive-600 text-white shadow-sm hover:bg-olive-800 hover:shadow-md active:bg-olive-800 disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed"
      : "bg-transparent text-olive-600 hover:bg-surface-inner hover:text-olive-800 disabled:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={[base, sz, variantCls, className].join(" ")}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export default Button;

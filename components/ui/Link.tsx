import * as React from "react";
import NextLink from "next/link";
import { Info, ArrowRight, ArrowUpRight } from "lucide-react";

type LinkProps = {
  href: string;
  external?: boolean;
  icon?: "info" | "arrow" | "none";
  subtle?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
};

export function Link({
  href,
  external,
  icon = "none",
  subtle = false,
  className = "",
  onClick,
  children,
}: LinkProps) {
  const cls = [
    "inline-flex items-center gap-1 text-gold-500 font-sans",
    subtle
      ? "no-underline hover:underline hover:[text-decoration-thickness:1px] hover:[text-underline-offset:2px]"
      : "underline [text-decoration-thickness:1px] [text-underline-offset:2px] hover:[text-decoration-thickness:2px] hover:brightness-90",
    "active:brightness-75 focus-ring-gold rounded-sm",
    className,
  ].join(" ");

  const leading =
    icon === "info" ? <Info className="h-3 w-3" aria-hidden /> : null;
  const trailing =
    icon === "arrow" ? (
      <ArrowRight className="h-3 w-3" aria-hidden />
    ) : external ? (
      <ArrowUpRight className="h-3 w-3" aria-hidden />
    ) : null;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        onClick={onClick}
      >
        {leading}
        <span>{children}</span>
        {trailing}
      </a>
    );
  }

  return (
    <NextLink href={href} className={cls} onClick={onClick}>
      {leading}
      <span>{children}</span>
      {trailing}
    </NextLink>
  );
}

export default Link;

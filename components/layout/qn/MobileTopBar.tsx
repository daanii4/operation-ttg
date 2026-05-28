"use client";

/**
 * QuasarNova v1 — §6.3 mobile top bar.
 *
 * 52px tall. Logo only on the left (no wordmark to save space), avatar circle
 * on the right that opens an account menu (Settings, Sign out).
 */

import * as React from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

export interface MobileTopBarProps {
  advisorInitials?: string;
  /** Optional override for sign-out (defaults to navigating to /auth/signout). */
  onSignOut?: () => void;
}

export function MobileTopBar({ advisorInitials, onSignOut }: MobileTopBarProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-qn-account-menu]")) return;
      setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <header
      className="md:hidden flex items-center justify-between"
      style={{
        height: 52,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        paddingLeft: 16,
        paddingRight: 16,
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <Link
        href="/dashboard"
        aria-label="Operation TTG home"
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: "var(--color-green)" }}
      >
        <img src="/logo-mark.png" alt="" className="h-7 w-7 object-contain" />
      </Link>
      <div className="relative" data-qn-account-menu>
        <button
          type="button"
          aria-label="Open account menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
          style={{
            background: "var(--color-row-alt)",
            color: "#374151",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {advisorInitials ?? "—"}
        </button>
        {open ? (
          <div
            role="menu"
            aria-label="Account"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md bg-white"
            style={{
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sheet)",
            }}
          >
            <Link
              role="menuitem"
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-[var(--color-row-alt)]"
              style={{ color: "var(--color-text)" }}
            >
              <Settings size={16} aria-hidden /> Settings
            </Link>
            {onSignOut ? (
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] hover:bg-[var(--color-row-alt)]"
                style={{ color: "var(--color-text)" }}
              >
                <LogOut size={16} aria-hidden /> Sign out
              </button>
            ) : (
              <a
                role="menuitem"
                href="/auth/signout"
                className="flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-[var(--color-row-alt)]"
                style={{ color: "var(--color-text)" }}
              >
                <LogOut size={16} aria-hidden /> Sign out
              </a>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default MobileTopBar;

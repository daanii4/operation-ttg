"use client";

/**
 * QuasarNova v1 — §6.1 desktop sidebar.
 *
 * Spec:
 *   • 220px wide, fixed, white, right border 1px #E5E7EB.
 *   • Logo block ~64px tall in the header.
 *   • Six nav rows, 44px height, 16px padding, 12px icon→label gap.
 *   • Active row gets the 3px green accent bar + #F0FDF4 background.
 *   • Settings pinned at the bottom; advisor block below it.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { isNavActive, PRIMARY_NAV, type NavEntry } from "./nav-config";

export interface AdvisorIdentity {
  name: string;
  email?: string;
  initials: string;
}

export interface SidebarProps {
  advisor?: AdvisorIdentity | null;
  /** Override sign-out handler (defaults to navigating to /auth/signout). */
  onSignOut?: () => void;
}

export function Sidebar({ advisor, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const settings = PRIMARY_NAV.find((n) => n.href === "/dashboard/settings");
  const primary = PRIMARY_NAV.filter((n) => n.href !== "/dashboard/settings");

  return (
    <aside
      aria-label="Primary navigation"
      className="hidden md:flex md:flex-col"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 220,
        background: "var(--color-bg)",
        borderRight: "1px solid var(--color-border)",
        zIndex: 40,
      }}
    >
      {/* Logo / wordmark block — height ≈64px. */}
      <div
        className="flex items-center gap-3 px-5"
        style={{ height: 64, borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: "var(--color-green)" }}
          aria-hidden
        >
          {/* Reuse the existing brand mark; the green tile satisfies the
              v1 visual without committing to a new asset. */}
          <img src="/logo-mark.png" alt="" className="h-7 w-7 object-contain" />
        </div>
        <div className="min-w-0">
          <p
            className="truncate font-serif"
            style={{ fontSize: 16, lineHeight: "20px", color: "var(--color-text)" }}
          >
            Operation TTG
          </p>
          <p
            className="truncate"
            style={{
              fontSize: 11,
              lineHeight: "14px",
              color: "var(--color-muted)",
              marginTop: 1,
            }}
          >
            Eligibility Intelligence
          </p>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: 8, paddingBottom: 8 }}
      >
        <ul role="list">
          {primary.map((entry) => (
            <NavRow key={entry.href} entry={entry} active={isNavActive(pathname, entry)} />
          ))}
        </ul>
      </nav>

      {/* Settings + advisor pinned to the bottom. */}
      <div style={{ borderTop: "1px solid var(--color-border)" }}>
        {settings && (
          <ul role="list">
            <NavRow entry={settings} active={isNavActive(pathname, settings)} />
          </ul>
        )}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{
              background: advisor ? "var(--color-row-alt)" : "var(--color-border)",
              color: "#374151",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {advisor?.initials ?? "—"}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate"
              style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)" }}
            >
              {advisor?.name ?? "Advisor"}
            </p>
            {onSignOut ? (
              <button
                type="button"
                onClick={onSignOut}
                className="qn-focus-ring text-left"
                style={{ fontSize: 11, color: "var(--color-muted)" }}
              >
                Sign out
              </button>
            ) : (
              <a
                href="/auth/signout"
                className="qn-focus-ring inline-flex items-center gap-1"
                style={{ fontSize: 11, color: "var(--color-muted)" }}
              >
                <LogOut size={11} aria-hidden /> Sign out
              </a>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavRow({ entry, active }: { entry: NavEntry; active: boolean }) {
  const Icon = entry.icon;
  return (
    <li>
      <Link
        href={entry.href}
        aria-current={active ? "page" : undefined}
        className="relative flex items-center gap-3 transition-colors duration-[120ms] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
        style={{
          height: 44,
          paddingLeft: 16,
          paddingRight: 16,
          background: active ? "var(--color-green-tint)" : "transparent",
          color: "var(--color-text)",
        }}
      >
        {active ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: "var(--color-green)",
            }}
          />
        ) : null}
        <Icon
          size={18}
          aria-hidden
          style={{ color: active ? "var(--color-green)" : "var(--color-muted)" }}
        />
        <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{entry.label}</span>
      </Link>
    </li>
  );
}

export default Sidebar;

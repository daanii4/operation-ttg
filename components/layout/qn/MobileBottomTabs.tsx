"use client";

/**
 * QuasarNova v1 — §3.4 mobile bottom tab bar.
 *
 * 56px tall, fixed to the viewport bottom. Five entries (Overview / Roster /
 * Eligibility / Trajectory / Briefings). Settings is reached via the avatar
 * dropdown on mobile per §3.4. Each tab is a 44×44 tap target.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, PRIMARY_NAV } from "./nav-config";

const MOBILE_TABS = PRIMARY_NAV.filter((n) => n.mobileTab);

export function MobileBottomTabs() {
  const pathname = usePathname();
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
        zIndex: 30,
      }}
    >
      <ul role="list" className="flex h-full items-stretch">
        {MOBILE_TABS.map((entry) => {
          const Icon = entry.icon;
          const active = isNavActive(pathname, entry);
          return (
            <li key={entry.href} className="flex-1">
              <Link
                href={entry.href}
                aria-current={active ? "page" : undefined}
                className="flex h-full flex-col items-center justify-center gap-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]"
                style={{
                  color: active ? "var(--color-green)" : "var(--color-muted)",
                  fontSize: 10,
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={20} aria-hidden strokeWidth={active ? 2.25 : 1.75} />
                <span>{entry.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileBottomTabs;

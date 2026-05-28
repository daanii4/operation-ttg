"use client";

/**
 * QuasarNova v1 — application shell.
 *
 * Composes the v1 chrome:
 *   • 220px white desktop sidebar (§6.1)
 *   • 56px desktop top bar (§6.2)
 *   • 52px mobile top bar with avatar (§6.3)
 *   • 56px mobile bottom tab bar (§3.4)
 *
 * Pages opt-in by wrapping their content in <QnShell>. The Roster and
 * Briefings tabs render this shell server-side (only the shell pieces that
 * need interaction are client components). Other tabs may continue to use
 * the legacy <DashboardShell> until their own redesigns ship.
 */

import * as React from "react";
import { Sidebar, type AdvisorIdentity } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileTopBar } from "./MobileTopBar";
import { MobileBottomTabs } from "./MobileBottomTabs";

export interface QnShellProps {
  pageTitle: string;
  eyebrow?: string;
  advisor?: AdvisorIdentity | null;
  /** Right-aligned actions in the desktop top bar. */
  topBarRight?: React.ReactNode;
  /**
   * When true, the page renders its own page-title bar inside `children`
   * (e.g. Roster mobile uses an in-page title row with a filter button).
   * The desktop top bar still renders.
   */
  hideMobilePageHeader?: boolean;
  /** Optional in-page mobile header (between top bar and content). */
  mobilePageHeader?: React.ReactNode;
  children: React.ReactNode;
}

export function QnShell({
  pageTitle,
  eyebrow,
  advisor,
  topBarRight,
  hideMobilePageHeader = false,
  mobilePageHeader,
  children,
}: QnShellProps) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-page)", color: "var(--color-text)" }}
    >
      <Sidebar advisor={advisor} />
      <MobileTopBar advisorInitials={advisor?.initials} />

      <div className="md:pl-[220px]">
        <TopBar pageTitle={pageTitle} eyebrow={eyebrow}>
          {topBarRight}
        </TopBar>

        {/* Mobile page header slot — pages can render their own title row /
            filter button here. Hidden on desktop where the TopBar owns it. */}
        {!hideMobilePageHeader && mobilePageHeader ? (
          <div className="md:hidden">{mobilePageHeader}</div>
        ) : null}

        <main
          id="main-content"
          tabIndex={-1}
          className="focus:outline-none"
          style={{
            // Reserve room for the persistent mobile bottom tab bar (56px)
            // plus a hair of extra padding so the last row isn't kissed by it.
            paddingBottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {children}
        </main>
      </div>

      <MobileBottomTabs />
    </div>
  );
}

export default QnShell;

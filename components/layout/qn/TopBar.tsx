"use client";

/**
 * QuasarNova v1 — §6.2 desktop top bar.
 *
 * 56px tall. Page title is rendered in DM Serif Display 22px (this is the page
 * name, not a hero — heroes use 28px elsewhere). Right side is reserved for
 * future global actions; today it's empty unless the page passes children.
 */

import * as React from "react";

export interface TopBarProps {
  pageTitle: string;
  /** Optional eyebrow shown above the page title (e.g. "ROSTER"). */
  eyebrow?: string;
  /** Optional actions rendered flush-right inside the bar. */
  children?: React.ReactNode;
}

export function TopBar({ pageTitle, eyebrow, children }: TopBarProps) {
  return (
    <header
      className="hidden md:flex md:items-center md:justify-between"
      style={{
        height: 56,
        background: "var(--color-bg)",
        borderBottom: "1px solid var(--color-border)",
        paddingLeft: 32,
        paddingRight: 32,
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div className="min-w-0 flex flex-col">
        {eyebrow ? (
          <span
            style={{
              fontSize: 10,
              lineHeight: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-muted)",
            }}
          >
            {eyebrow}
          </span>
        ) : null}
        <h1
          className="font-serif truncate"
          style={{
            fontSize: 22,
            lineHeight: "28px",
            fontWeight: 400,
            color: "var(--color-text)",
          }}
        >
          {pageTitle}
        </h1>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}

export default TopBar;

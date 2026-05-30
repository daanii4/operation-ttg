/**
 * AppHeader — branded olive header (Operation Scholars OS chrome).
 * Styles live in styles/scholars-header.css (imported from app/layout.tsx), not inlined here,
 * so server HTML matches client hydration (React escapes inline <style> text differently).
 */

import Link from "next/link";
import type { ReactNode } from "react";

export type AppHeaderProps = {
  eyebrow?: string;
  /** Visible title; use with hideTitleZone + sr-only heading for student profiles. */
  pageTitle: string;
  pageSubtitle?: string;
  children?: ReactNode;
  onMenuClick?: () => void;
  menuOpen?: boolean;
  hideDesktopBrand?: boolean;
  /** Omit eyebrow / title / subtitle row (identity lives in page body, e.g. IdentityHeader). */
  hideTitleZone?: boolean;
};

export function AppHeader({
  eyebrow,
  pageTitle,
  pageSubtitle,
  children,
  onMenuClick,
  menuOpen = false,
  hideDesktopBrand = false,
  hideTitleZone = false,
}: AppHeaderProps) {
  const headerMods = [
    hideDesktopBrand ? "scholars-header--no-desktop-brand" : "",
    hideTitleZone ? "scholars-header--no-title" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={["scholars-header", headerMods].filter(Boolean).join(" ")} role="banner">
      <svg
        className="scholars-header__svg-bg"
        viewBox="0 0 1400 96"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <pattern id="scholars-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill="#FFFFFF" opacity="0.06" />
          </pattern>
        </defs>

        <rect width="1400" height="96" fill="#243318" />
        <rect width="1400" height="96" fill="url(#scholars-dots)" />

        <ellipse cx="-20" cy="40" rx="68" ry="24" fill="#2E4220" opacity="0.85" transform="rotate(-30,-20,40)" />
        <ellipse cx="10" cy="80" rx="50" ry="18" fill="#334A24" opacity="0.6" transform="rotate(-50,10,80)" />

        <ellipse cx="1418" cy="60" rx="78" ry="26" fill="#2E4220" opacity="0.8" transform="rotate(25,1418,60)" />
        <ellipse cx="1390" cy="10" rx="55" ry="20" fill="#334A24" opacity="0.5" transform="rotate(10,1390,10)" />

        <path d="M 1290 -10 Q 1350 48 1290 106" stroke="#D6A033" strokeWidth="1" fill="none" opacity="0.22" />
        <path d="M 1313 -10 Q 1373 48 1313 106" stroke="#D6A033" strokeWidth="0.7" fill="none" opacity="0.14" />

        <polygon points="980,22 981.5,27 987,27 982.5,30 984,35 980,32 976,35 977.5,30 973,27 978.5,27" fill="#D6A033" opacity="0.42" />
        <polygon points="1052,71 1053,75 1057,75 1053.8,77.5 1055,81.5 1052,79 1049,81.5 1050.2,77.5 1047,75 1051,75" fill="#D6A033" opacity="0.3" />
      </svg>

      <div className="scholars-header__content">
        {onMenuClick ? (
          <button
            type="button"
            className="scholars-header__menu-btn"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="ttg-mobile-navigation"
            onClick={onMenuClick}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path
                className="origin-center transition-all duration-300 ease-in-out"
                style={{ transform: menuOpen ? "translateY(6px) rotate(45deg)" : "translateY(0) rotate(0)" }}
                d="M4 6h16"
                strokeLinecap="round"
              />
              <path
                className="origin-center transition-all duration-200 ease-out"
                style={{ opacity: menuOpen ? 0 : 1 }}
                d="M4 12h16"
                strokeLinecap="round"
              />
              <path
                className="origin-center transition-all duration-300 ease-in-out"
                style={{ transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "translateY(0) rotate(0)" }}
                d="M4 18h16"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}

        <div className="scholars-header__brand">
          <Link href="/dashboard/analytics" className="scholars-header__logo-frame" aria-label="Go to cohort dashboard">
            <img src="/logo-mark.png" alt="" className="scholars-header__logo" width={34} height={34} />
          </Link>
          <div className="scholars-header__brand-text">
            <span className="scholars-header__wordmark">Operation TTG</span>
            <span className="scholars-header__tag">STUDENT INTELLIGENCE OS</span>
          </div>
        </div>

        <div className="scholars-header__divider" aria-hidden />

        {hideTitleZone ? null : (
          <div className="scholars-header__title-zone">
            {eyebrow ? <span className="scholars-header__eyebrow">{eyebrow}</span> : null}
            <h1 className="scholars-header__title">{pageTitle}</h1>
            {pageSubtitle ? <span className="scholars-header__subtitle">{pageSubtitle}</span> : null}
          </div>
        )}

        {children ? <div className="scholars-header__actions">{children}</div> : null}
      </div>
    </header>
  );
}

export default AppHeader;

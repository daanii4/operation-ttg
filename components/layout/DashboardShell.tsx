"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, Map, PanelLeftClose, type LucideIcon } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useLocalStorageBoolean } from "@/lib/hooks/use-local-storage-boolean";

const NAV_SECTIONS = ["Main"] as const;

type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: (typeof NAV_SECTIONS)[number];
};

const NAV_LINKS: NavLinkItem[] = [
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    section: "Main",
  },
  {
    href: "/about/roadmap",
    label: "Roadmap",
    icon: Map,
    section: "Main",
  },
];

function normalizePath(pathname: string | null): string {
  if (!pathname) return "";
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isNavActive(pathname: string | null, href: string): boolean {
  const p = normalizePath(pathname);
  if (!p) return false;
  if (href === "/dashboard/analytics") {
    return p === "/dashboard" || p.startsWith("/dashboard/");
  }
  return p === href || p.startsWith(`${href}/`);
}

function NavLinks({
  open,
  onLinkClick,
}: {
  open: boolean;
  onLinkClick: () => void;
}) {
  const pathname = usePathname();
  let staggerIndex = 0;

  const linkInner = (link: NavLinkItem, active: boolean, index: number) => {
    const Icon = link.icon;
    return (
      <>
        <Icon
          size={15}
          aria-hidden
          className={active ? "shrink-0 opacity-100" : "shrink-0 opacity-60"}
        />
        <span
          className={[
            "font-sans text-[12px] font-medium leading-none whitespace-nowrap",
            "transition-all duration-200 ease-out",
            open
              ? "translate-x-0 opacity-100"
              : "pointer-events-none w-0 -translate-x-2 overflow-hidden opacity-0",
          ].join(" ")}
          style={{ transitionDelay: open ? `${index * 30}ms` : "0ms" }}
        >
          {link.label}
        </span>
      </>
    );
  };

  return (
    <>
      {NAV_SECTIONS.map((section) => {
        const sectionLinks = NAV_LINKS.filter((l) => l.section === section);
        if (sectionLinks.length === 0) return null;
        return (
          <div key={section} className="mb-1">
            <p
              className={[
                "mb-1.5 mt-4 px-3 pb-1 pt-5 text-[8px] font-medium uppercase tracking-[0.08em] transition-opacity duration-200",
                open
                  ? "opacity-100"
                  : "pointer-events-none h-0 overflow-hidden opacity-0",
              ].join(" ")}
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              {section}
            </p>
            {sectionLinks.map((link) => {
              const active = isNavActive(pathname, link.href);
              const idx = staggerIndex++;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={!open ? link.label : undefined}
                  onClick={onLinkClick}
                  className={[
                    "mx-2 flex h-9 items-center gap-3 rounded-lg px-2.5 transition-all duration-150 ease-in-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033] focus-visible:ring-offset-0 focus-visible:ring-offset-transparent",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/45 hover:bg-white/[0.06] hover:text-white/80",
                    !open && "mx-auto w-10 justify-center px-0",
                  ].join(" ")}
                >
                  {linkInner(link, active, idx)}
                </Link>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

export type DashboardShellProps = {
  eyebrow?: string;
  pageTitle: string;
  pageSubtitle?: string;
  /** Shown in AppHeader action zone (use Scholars-style btn-ghost / btn-gold classes). */
  headerActions?: ReactNode;
  /** Hide visible eyebrow/title/subtitle in AppHeader. */
  hideHeaderTitle?: boolean;
  /** Omit the olive AppHeader entirely (student profile). Mobile-only menu strip opens the drawer. */
  omitAppHeader?: boolean;
  children: ReactNode;
};

export function DashboardShell({
  eyebrow,
  pageTitle,
  pageSubtitle,
  headerActions,
  hideHeaderTitle = false,
  omitAppHeader = false,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useLocalStorageBoolean("ttg-sidebar", true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const dashboardHeader =
    omitAppHeader ? null : (
      <AppHeader
        eyebrow={hideHeaderTitle ? undefined : eyebrow}
        pageTitle={pageTitle}
        pageSubtitle={hideHeaderTitle ? undefined : pageSubtitle}
        menuOpen={mobileMenuOpen}
        onMenuClick={() => setMobileMenuOpen((open) => !open)}
        hideDesktopBrand
        hideTitleZone={hideHeaderTitle}
      >
        {headerActions}
      </AppHeader>
    );

  const mobileDrawerTop = omitAppHeader ? "top-14" : "top-[72px] sm:top-[96px]";

  const mobileMenuTrigger = omitAppHeader ? (
    <div className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center border-b-4 border-[#D6A033] bg-[#243318] px-4 lg:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033]"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="ttg-mobile-navigation"
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path
            className="origin-center transition-all duration-300 ease-in-out"
            style={{ transform: mobileMenuOpen ? "translateY(6px) rotate(45deg)" : "translateY(0) rotate(0)" }}
            d="M4 6h16"
            strokeLinecap="round"
          />
          <path
            className="origin-center transition-all duration-200 ease-out"
            style={{ opacity: mobileMenuOpen ? 0 : 1 }}
            d="M4 12h16"
            strokeLinecap="round"
          />
          <path
            className="origin-center transition-all duration-300 ease-in-out"
            style={{ transform: mobileMenuOpen ? "translateY(-6px) rotate(-45deg)" : "translateY(0) rotate(0)" }}
            d="M4 18h16"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[var(--surface-page)]">
      {mobileMenuTrigger}

      {mobileMenuOpen && (
        <div
          id="ttg-mobile-navigation"
          className={`fixed inset-x-0 bottom-0 z-[55] lg:hidden ${mobileDrawerTop}`}
          aria-modal="true"
        >
          <div
            className="absolute inset-0 z-[55] bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <aside
            className="absolute left-0 top-0 z-[60] flex h-full w-[260px] flex-col bg-[var(--olive-800)] transition-transform duration-100"
            style={{ transform: "translateX(0)" }}
          >
            <div className="border-b border-white/[0.08] px-4 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="os-motif flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden bg-[var(--gold-500)]">
                    <img
                      src="/logo-mark.png"
                      alt=""
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                  <div>
                    <p
                      className="text-[15px] font-normal leading-tight tracking-[-0.01em] text-white"
                      style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                    >
                      Operation Scholars
                    </p>
                    <p
                      className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      Behavioral Intelligence
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded p-2 transition-colors hover:bg-white/10"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto overflow-x-visible px-3 py-2">
              <NavLinks open onLinkClick={closeMobileMenu} />
            </nav>
            <div className="border-t border-white/[0.06] px-4 py-3">
              <p className="font-sans text-[11px] text-white/45">Operation TTG demo</p>
              <p className="mt-0.5 font-sans text-[10px] text-white/30">Manteca USD cohort</p>
            </div>
          </aside>
        </div>
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-white/[0.06] bg-[#2D3820] lg:flex",
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarOpen ? "w-60" : "w-14 cursor-pointer",
        ].join(" ")}
        aria-expanded={sidebarOpen}
        aria-label={
          sidebarOpen
            ? "Main navigation"
            : "Main navigation, collapsed. Click anywhere on the bar to expand."
        }
        onClick={() => {
          if (!sidebarOpen) setSidebarOpen(true);
        }}
      >
        <div
          className={[
            "flex h-16 shrink-0 items-center border-b border-white/[0.08] px-4",
            sidebarOpen ? "justify-start gap-3" : "justify-center px-2",
          ].join(" ")}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#D6A033]"
            style={{ minWidth: 36, minHeight: 36 }}
          >
            <img src="/logo-mark.png" alt="" className="h-7 w-7 object-contain" />
          </div>
          <div
            className={[
              "min-w-0 overflow-hidden transition-all duration-200 ease-out",
              sidebarOpen ? "max-w-[180px] translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0",
            ].join(" ")}
          >
            <p
              className="text-[14px] font-normal leading-tight text-white"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Operation Scholars
            </p>
            <p
              className="mt-0.5 text-[8px] uppercase tracking-[0.1em]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Behavioral Intelligence
            </p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-visible overscroll-y-contain px-0 py-2">
          <NavLinks open={sidebarOpen} onLinkClick={closeMobileMenu} />
        </nav>

        <div className="flex shrink-0 flex-col gap-1 border-t border-white/[0.06] px-2 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={[
              "flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-white/40 transition-all duration-150",
              "hover:bg-white/[0.06] hover:text-white/70",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033]",
              !sidebarOpen && "mx-auto w-10 justify-center px-0",
            ].join(" ")}
          >
            <PanelLeftClose
              size={15}
              className={[!sidebarOpen && "rotate-180", "shrink-0 transition-transform duration-300"]
                .filter(Boolean)
                .join(" ")}
              aria-hidden
            />
            <span
              className={[
                "font-sans text-[12px] font-medium whitespace-nowrap transition-all duration-200",
                sidebarOpen
                  ? "opacity-100"
                  : "pointer-events-none w-0 overflow-hidden opacity-0",
              ].join(" ")}
            >
              Collapse
            </span>
          </button>

          <div
            className={[
              "px-2 font-sans text-[10px] leading-snug text-white/40",
              sidebarOpen ? "opacity-100" : "pointer-events-none h-0 overflow-hidden opacity-0",
            ].join(" ")}
          >
            Operation TTG demo · Manteca Unified School District
          </div>
        </div>
      </aside>

      <div
        className={[
          "min-h-[100dvh] min-w-0 overflow-x-hidden transition-[padding-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarOpen ? "lg:pl-60" : "lg:pl-14",
          omitAppHeader ? "pt-14 lg:pt-0" : "",
        ].join(" ")}
      >
        {dashboardHeader}

        <div className="min-w-0 space-y-4 px-4 pb-8 pt-6 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

export default DashboardShell;

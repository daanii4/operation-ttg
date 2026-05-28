/**
 * QuasarNova v1 — shared navigation config.
 *
 * One source of truth for the desktop sidebar (§6.1) and the mobile bottom
 * tab bar (§3.4). Changes here propagate to every page that mounts the
 * dashboard shell.
 *
 * `mobileTab=true` means the entry is part of the persistent mobile bottom
 * tab bar (max five entries, hard-capped to keep tap targets readable).
 * Settings is reached via the avatar dropdown on mobile per the spec.
 */

import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When true, only highlight on exact pathname match. */
  exact?: boolean;
  /** Include in the mobile bottom tab bar. Max 5 (§3.4). */
  mobileTab?: boolean;
};

export const PRIMARY_NAV: NavEntry[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true, mobileTab: true },
  { href: "/dashboard/roster", label: "Roster", icon: Users, mobileTab: true },
  { href: "/dashboard/eligibility", label: "Eligibility", icon: ClipboardCheck, mobileTab: true },
  { href: "/dashboard/trajectory", label: "Trajectory", icon: TrendingUp, mobileTab: true },
  { href: "/dashboard/briefings", label: "Briefings", icon: FileText, mobileTab: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function isNavActive(pathname: string | null | undefined, entry: NavEntry): boolean {
  if (!pathname) return false;
  const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (entry.exact) return p === entry.href;
  return p === entry.href || p.startsWith(`${entry.href}/`);
}

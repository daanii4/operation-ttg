/**
 * Sprint 6 / Workstream C-2 — TTG permission system.
 *
 * Layered over the legacy ADVISOR/ADMIN roles. The team role lives on the
 * AdvisorProfile (keyed by Supabase user id) so we can grant fine-grained
 * permissions without rewriting the existing session pipeline.
 *
 * Three roles, six permissions:
 *   • owner   → all six (manage team, see/export everything).
 *   • advisor → see/edit own students + export own (default for new users).
 *   • viewer  → read-only across the cohort.
 */

import type { AdvisorRole } from "@prisma/client";

export type TtgPermission =
  | "student:read"
  | "student:write"
  | "student:assign"
  | "team:manage"
  | "export:own"
  | "export:all";

export const ROLE_PERMISSIONS: Record<AdvisorRole, TtgPermission[]> = {
  owner: [
    "student:read",
    "student:write",
    "student:assign",
    "team:manage",
    "export:own",
    "export:all",
  ],
  advisor: ["student:read", "student:write", "export:own"],
  viewer: ["student:read"],
};

export function hasPermission(
  role: AdvisorRole,
  permission: TtgPermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Throws PermissionError when the role does not include the permission. */
export class PermissionError extends Error {
  readonly permission: TtgPermission;

  constructor(permission: TtgPermission) {
    super(`PERMISSION_DENIED:${permission}`);
    this.permission = permission;
    this.name = "PermissionError";
  }
}

export function assertPermission(
  role: AdvisorRole,
  permission: TtgPermission
): void {
  if (!hasPermission(role, permission)) {
    throw new PermissionError(permission);
  }
}

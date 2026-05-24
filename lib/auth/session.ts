/**
 * Session helpers — scaffolded for NextAuth; uses env headers in dev until auth is wired.
 */
import { headers } from "next/headers";
import type { UserRole } from "@prisma/client";

export interface TtgSession {
  userId: string;
  role: UserRole;
  email?: string;
  name?: string;
}

/**
 * Resolves the current TTG session.
 * Production: replace with getServerSession from next-auth.
 * Dev/demo: set x-ttg-user-id and x-ttg-user-role request headers, or TTG_DEV_USER_* env vars.
 */
export async function getTtgSession(): Promise<TtgSession | null> {
  const h = await headers();
  const userId =
    h.get("x-ttg-user-id") ?? process.env.TTG_DEV_USER_ID ?? null;
  const roleRaw =
    h.get("x-ttg-user-role") ?? process.env.TTG_DEV_USER_ROLE ?? "ADVISOR";

  if (!userId) {
    if (process.env.TTG_ALLOW_ANONYMOUS_SESSION === "true") {
      return { userId: "anonymous", role: "ADVISOR" };
    }
    return null;
  }

  const role = roleRaw === "ADMIN" ? "ADMIN" : "ADVISOR";
  return {
    userId,
    role,
    email: h.get("x-ttg-user-email") ?? undefined,
    name: h.get("x-ttg-user-name") ?? undefined,
  };
}

export async function requireTtgSession(): Promise<TtgSession> {
  const session = await getTtgSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdminSession(): Promise<TtgSession> {
  const session = await requireTtgSession();
  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

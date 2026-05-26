import { headers } from "next/headers";
import type { UserRole } from "@prisma/client";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveTtgRole } from "./roles";

export interface TtgSession {
  userId: string;
  role: UserRole;
  email?: string;
  name?: string;
}

async function getDevHeaderSession(): Promise<TtgSession | null> {
  const h = await headers();
  const userId = h.get("x-ttg-user-id") ?? process.env.TTG_DEV_USER_ID ?? null;
  const roleRaw = h.get("x-ttg-user-role") ?? process.env.TTG_DEV_USER_ROLE ?? "ADVISOR";

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

export async function getTtgSession(): Promise<TtgSession | null> {
  if (!isSupabaseAuthConfigured()) {
    return getDevHeaderSession();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      if (process.env.NODE_ENV === "development") {
        return getDevHeaderSession();
      }
      return null;
    }

    const role = await resolveTtgRole(user);
    const name =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0];

    return {
      userId: user.id,
      role,
      email: user.email ?? undefined,
      name,
    };
  } catch {
    if (process.env.NODE_ENV === "development") {
      return getDevHeaderSession();
    }
    return null;
  }
}

export async function requireTtgSession(): Promise<TtgSession> {
  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") {
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

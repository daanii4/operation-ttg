import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserRole } from "@prisma/client";
import { prismaTtg } from "@/lib/prisma";

/**
 * Role resolution order:
 * 1. Supabase app_metadata.ttg_role or user_metadata.ttg_role
 * 2. ttg.User row matched by email
 * 3. ADVISOR (default)
 */
export async function resolveTtgRole(user: SupabaseUser): Promise<UserRole> {
  const metaRole =
    (user.app_metadata?.ttg_role as string | undefined) ??
    (user.user_metadata?.ttg_role as string | undefined);

  if (metaRole === "ADMIN") return "ADMIN";
  if (metaRole === "ADVISOR") return "ADVISOR";

  if (user.email) {
    const dbUser = await prismaTtg.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });
    if (dbUser) return dbUser.role;
  }

  return "ADVISOR";
}

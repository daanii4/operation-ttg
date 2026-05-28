/**
 * Helper: derive a display-friendly advisor identity from the TTG session.
 * Used by the QuasarNova shell to render the sidebar advisor row + mobile
 * avatar. Returns `null` when there's no session — pages decide how to fall
 * back (typically by redirecting via middleware before this is called).
 */

import { getTtgSession } from "@/lib/auth/session";

export interface AdvisorDisplay {
  name: string;
  email?: string;
  initials: string;
}

function deriveInitials(input: string | null | undefined): string {
  if (!input) return "—";
  const trimmed = input.trim();
  if (!trimmed) return "—";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  // Fallback for single-token names or emails.
  const token = parts[0]!;
  if (token.includes("@")) {
    return token.slice(0, 2).toUpperCase();
  }
  return token.slice(0, 2).toUpperCase();
}

export async function getAdvisorDisplay(): Promise<AdvisorDisplay | null> {
  const session = await getTtgSession();
  if (!session || session.userId === "anonymous") return null;
  const display = session.name ?? session.email ?? "Advisor";
  return {
    name: display,
    email: session.email,
    initials: deriveInitials(session.name ?? session.email),
  };
}

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseAuthConfigured } from "./env";

export function createSupabaseBrowserClient() {
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Supabase auth is not configured");
  }
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

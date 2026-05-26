"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard/analytics";
  const authError = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(
    authError === "auth_callback_failed" ? "Sign-in could not be completed. Try again." : null
  );
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Supabase auth is not configured for this environment.");
      setLoading(false);
    }
  }

  return (
    <Card variant="default" padding="lg" className="w-full max-w-md">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-[color:var(--border-default)] bg-surface-inner px-3 py-2 font-sans text-[14px] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          />
        </div>

        {error ? (
          <p className="font-sans text-[13px] text-band-urgent" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-gold-500 px-4 py-2.5 font-sans text-[13px] font-semibold text-[#1a1f14] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Card>
  );
}

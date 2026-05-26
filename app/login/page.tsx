import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in · Operation TTG",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-page)] px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-500">
          <img src="/logo-mark.png" alt="" className="h-8 w-8 object-contain" />
        </div>
        <h1
          className="font-serif text-[28px] text-text-primary"
          style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
        >
          Operation TTG
        </h1>
        <p className="max-w-sm font-sans text-[13px] text-text-secondary">
          Advisor sign-in — Manteca USD eligibility intelligence demo
        </p>
      </div>

      <Suspense fallback={<div className="h-48 w-full max-w-md animate-pulse rounded bg-surface-inner" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-8 max-w-md text-center font-mono text-[11px] text-text-tertiary">
        ADMIN access: set{" "}
        <code className="text-text-secondary">app_metadata.ttg_role</code> to{" "}
        <code className="text-text-secondary">ADMIN</code> in Supabase Auth, or match a row in{" "}
        <code className="text-text-secondary">ttg.User</code>.
      </p>
    </div>
  );
}

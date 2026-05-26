"use client";

import { LogOut } from "lucide-react";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={[
          "flex w-full items-center gap-3 rounded-lg text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A033]",
          compact ? "mx-auto h-9 w-10 justify-center px-0" : "h-9 px-2.5",
        ].join(" ")}
        title="Sign out"
      >
        <LogOut size={15} className="shrink-0" aria-hidden />
        {!compact ? (
          <span className="font-sans text-[12px] font-medium">Sign out</span>
        ) : (
          <span className="sr-only">Sign out</span>
        )}
      </button>
    </form>
  );
}

export default SignOutButton;

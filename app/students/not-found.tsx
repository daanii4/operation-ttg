import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";

export default function StudentNotFound() {
  return (
    <DashboardShell eyebrow="STUDENT" pageTitle="Not found" hideHeaderTitle>
      <div className="flex flex-col items-center justify-center gap-4 pt-24 text-center">
        <p className="font-sans text-[18px] font-semibold text-[var(--text-primary)]">
          Student not found
        </p>
        <p className="max-w-sm font-sans text-[13px] text-[var(--text-tertiary)]">
          This student does not exist or you do not have access to their profile.
        </p>
        <Link
          href="/dashboard/roster"
          className="font-sans text-[13px] font-medium text-[var(--olive-600)] underline underline-offset-2"
        >
          Back to Roster
        </Link>
      </div>
    </DashboardShell>
  );
}

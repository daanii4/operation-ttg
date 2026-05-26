import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { getTtgSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin · Operation TTG",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getTtgSession();

  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/dashboard/analytics");
  }

  return (
    <DashboardShell
      eyebrow="ADMIN"
      pageTitle="Course classification"
      pageSubtitle="District onboarding and paste-and-parse course catalog import (D2)."
    >
      {children}
    </DashboardShell>
  );
}

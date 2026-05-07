import { redirect } from "next/navigation";

/**
 * Cohort UI lives at /dashboard/analytics. Keep /dashboard as a stable entry.
 */
export default function DashboardIndexPage() {
  redirect("/dashboard/analytics");
}

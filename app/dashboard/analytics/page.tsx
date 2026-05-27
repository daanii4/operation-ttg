import { redirect } from "next/navigation";

/**
 * Sprint 5 — sidebar restructure (Operation TTG · May 2026).
 *
 * /dashboard/analytics is preserved as a redirect to /dashboard so that any
 * deep links from prior sprints (e.g. breadcrumbs, emails, bookmarks) keep
 * resolving instead of 404ing. The Overview content now lives at /dashboard.
 */
export default function AnalyticsRedirectPage() {
  redirect("/dashboard");
}

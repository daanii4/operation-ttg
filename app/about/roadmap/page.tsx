import type { Metadata } from "next";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import RoadmapPageClient from "@/app/about/roadmap/RoadmapPageClient";
import { getProductRoadmapSnapshot, toRoadmapVersionCards } from "@/lib/roadmap";
import { ensureAdvisorProfile } from "@/lib/auth/advisor-profile";
import { getTtgSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Product Roadmap · Operation TTG",
  description:
    "Live product roadmap — status is derived from the codebase and updates as capabilities ship.",
};

export default async function RoadmapPage() {
  const snapshot = getProductRoadmapSnapshot();
  const versions = toRoadmapVersionCards(snapshot.phases);
  const session = await getTtgSession();
  const profile =
    session && session.userId !== "anonymous"
      ? await ensureAdvisorProfile(session).catch(() => null)
      : null;
  const showInternalDetails = profile?.teamRole === "owner";

  return (
    <DashboardShell
      eyebrow="PRODUCT"
      pageTitle="Roadmap"
      pageSubtitle="Capability status is computed from the current codebase — not a static slide deck."
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/dashboard" },
          { label: "Product Roadmap" },
        ]}
      />

      <RoadmapPageClient
        summary={snapshot.summary}
        generatedAt={snapshot.generatedAt}
        next={snapshot.next}
        versions={versions}
        showInternalDetails={showInternalDetails}
      />
    </DashboardShell>
  );
}

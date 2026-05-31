import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { RoadmapPageLoading } from "@/app/about/roadmap/RoadmapPageClient";

export default function RoadmapLoading() {
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
      <RoadmapPageLoading />
    </DashboardShell>
  );
}

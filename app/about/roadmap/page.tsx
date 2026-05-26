import type { Metadata } from "next";
import { Info } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Card from "@/components/ui/Card";
import RoadmapVersionCard from "@/components/ttg/RoadmapVersionCard";
import RoadmapWhatsNextCard from "@/components/ttg/RoadmapWhatsNextCard";
import {
  getProductRoadmapSnapshot,
  toRoadmapVersionCards,
} from "@/lib/roadmap";

export const metadata: Metadata = {
  title: "Product Roadmap · Operation TTG",
  description:
    "Live product roadmap — status is derived from the codebase and updates as capabilities ship.",
};

export default function RoadmapPage() {
  const snapshot = getProductRoadmapSnapshot();
  const versions = toRoadmapVersionCards(snapshot.phases);

  return (
    <DashboardShell
      eyebrow="PRODUCT"
      pageTitle="Roadmap"
      pageSubtitle="Capability status is computed from the current codebase — not a static slide deck."
    >
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/dashboard/analytics" },
          { label: "Product Roadmap" },
        ]}
      />

      {snapshot.next ? <RoadmapWhatsNextCard next={snapshot.next} /> : null}

      <div className="mt-6 grid gap-6 mobile:grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-2 xl:grid-cols-4">
        {versions.map((v) => (
          <RoadmapVersionCard key={v.version} v={v} />
        ))}
      </div>

      <Card variant="inner" padding="md" className="mt-6 rounded">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden />
          <p className="font-mono text-[12px] leading-[1.55] text-text-secondary">
            {snapshot.summary} Last resolved{" "}
            {new Date(snapshot.generatedAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            . Source: <code className="text-text-primary">lib/roadmap/</code>
          </p>
        </div>
      </Card>
    </DashboardShell>
  );
}

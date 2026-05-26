import type { Metadata } from "next";
import TTGRoadmap from "@/components/ttg/TTGRoadmap";

export const metadata: Metadata = {
  title: "Product Roadmap · Operation TTG",
  description:
    "Operation TTG product roadmap — v0.1 live through v2.0 horizon. Every function traces to a documented authority.",
};

export default function RoadmapPage() {
  return <TTGRoadmap />;
}

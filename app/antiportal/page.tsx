import type { Metadata } from "next";
import { VisionSection } from "@/components/vision/VisionSection";

export const metadata: Metadata = { title: "Antiportal · Heroes App" };

export default function AntiportalPage() {
  return <VisionSection kind="antiportal" />;
}

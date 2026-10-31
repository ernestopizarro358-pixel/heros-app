import type { Metadata } from "next";
import { VisionSection } from "@/components/vision/VisionSection";

export const metadata: Metadata = { title: "Portal · Heroes App" };

export default function PortalPage() {
  return <VisionSection kind="portal" />;
}

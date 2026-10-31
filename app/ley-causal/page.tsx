import type { Metadata } from "next";
import { CausalSection } from "@/components/causal/CausalSection";

export const metadata: Metadata = { title: "Ley Causal · Heroes App" };

export default function CausalPage() {
  return <CausalSection />;
}

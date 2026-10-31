import type { Metadata } from "next";
import { HabitsSection } from "@/components/habits/HabitsSection";

export const metadata: Metadata = { title: "Hábitos · Heroes App" };

export default function HabitsPage() {
  return <HabitsSection />;
}

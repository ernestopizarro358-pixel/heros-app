import type { Metadata } from "next";
import { Suspense } from "react";
import { BossSection } from "@/components/boss/BossSection";

export const metadata: Metadata = { title: "Lucha contra el Jefe · Heroes App" };

export default function BossPage() {
  return (
    <Suspense>
      <BossSection />
    </Suspense>
  );
}

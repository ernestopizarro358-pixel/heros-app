import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit, Press_Start_2P } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--ff-outfit", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--ff-mono", display: "swap" });
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--ff-pixel", display: "swap" });

export const metadata: Metadata = {
  title: "Heroes App",
  description: "Mi sistema de desarrollo personal: hábitos, portal, antiportal, ley causal y jefes.",
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${mono.variable} ${pixel.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

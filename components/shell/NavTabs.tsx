"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const TABS = [
  { href: "/habitos", label: "Hábitos", active: "text-ink", glow: "rgb(255 255 255 / 0.06)" },
  { href: "/portal", label: "Portal", active: "text-mint", glow: "rgb(94 234 212 / 0.12)" },
  { href: "/antiportal", label: "Antiportal", active: "text-[#e07a7a]", glow: "rgb(194 84 84 / 0.16)" },
  { href: "/ley-causal", label: "Ley Causal", active: "text-gold", glow: "rgb(251 191 36 / 0.12)" },
  { href: "/jefe", label: "Lucha contra el Jefe", active: "text-[#ff6b81]", glow: "rgb(225 29 72 / 0.18)" },
];

export function NavTabs() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Keep the active tab visible on narrow screens.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [pathname]);

  return (
    <nav aria-label="Secciones" className="mt-5 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="no-scrollbar flex w-max max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface/80 p-1 backdrop-blur sm:w-fit">
        {TABS.map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={isActive ? activeRef : undefined}
              aria-current={isActive ? "page" : undefined}
              className={`relative shrink-0 rounded-lg px-3.5 py-2 font-mono text-[10.5px] font-semibold tracking-[0.16em] whitespace-nowrap uppercase transition-colors sm:px-4 ${
                isActive ? tab.active : "text-faint hover:text-soft"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg border border-white/[0.07] bg-[#1c1c1c]"
                  style={{ boxShadow: `0 0 18px ${tab.glow}` }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

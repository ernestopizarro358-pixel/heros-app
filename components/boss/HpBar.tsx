"use client";

import { motion } from "framer-motion";
import { BOSS_MAX_HP } from "@/lib/game.config";

/** Fighting-game HP bar: the red fill drops at once, a pale "ghost" follows. */
export function HpBar({ hp, compact = false }: { hp: number; compact?: boolean }) {
  const pct = Math.max(0, Math.min(100, (hp / BOSS_MAX_HP) * 100));
  const low = pct <= 30;

  return (
    <div className="flex w-full items-center gap-3">
      <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#ff4d6d]">HP</span>
      <div
        className={`relative flex-1 overflow-hidden rounded-full border border-[#ff4d6d]/45 bg-black/70 shadow-[inset_0_1px_4px_rgb(0_0_0/0.8)] ${compact ? "h-2" : "h-3.5"}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={BOSS_MAX_HP}
        aria-valuenow={hp}
        aria-label="Vida del jefe"
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-[#ffd7de]/70"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
        />
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#9d0b2b,#e11d48_60%,#ff4d6d)] shadow-[0_0_12px_rgb(255_77_109/0.7)] ${low && hp > 0 ? "animate-pulse" : ""}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/20" />
        </motion.div>
      </div>
      <span className="min-w-[4.5rem] text-right font-mono text-[11px] font-semibold text-soft tabular-nums">
        {hp} / {BOSS_MAX_HP}
      </span>
    </div>
  );
}

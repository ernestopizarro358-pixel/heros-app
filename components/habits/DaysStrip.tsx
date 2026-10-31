"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { DayKey } from "@/lib/data/types";
import { formatDayLong, lastDays } from "@/lib/date";

const DAYS = 30;

interface Props {
  completions: DayKey[];
  today: DayKey;
  priority: boolean;
  onTogglePast: (day: DayKey, done: boolean) => void;
  onToggleToday: () => void;
}

/** "ÚLTIMOS 30 DÍAS" row. Past days are editable; today mirrors the big circle. */
export function DaysStrip({ completions, today, priority, onTogglePast, onToggleToday }: Props) {
  const done = useMemo(() => new Set(completions), [completions]);
  const past = useMemo(() => lastDays(today, DAYS).slice(0, -1), [today]);
  const todayDone = done.has(today);

  const filled = priority
    ? "bg-gold border-gold shadow-[0_0_8px_rgb(251_191_36/0.45)]"
    : "bg-mint-2 border-mint-2 shadow-[0_0_8px_rgb(110_231_183/0.4)]";

  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <p className="label truncate !text-[9px] sm:!text-[10px]">
          Últimos 30 días<span className="hidden sm:inline"> · haz clic en cualquier día para rellenar los datos.</span>
        </p>
        <p className="label shrink-0 !text-[9px] sm:!text-[10px]">Hoy →</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 gap-[2px] sm:gap-[3px]" role="group" aria-label="Últimos 30 días">
          {past.map((day) => {
            const isDone = done.has(day);
            return (
              <motion.button
                key={day}
                type="button"
                whileHover={{ scale: 1.25, zIndex: 1 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => onTogglePast(day, !isDone)}
                title={`${formatDayLong(day)} — ${isDone ? "cumplido" : "sin marcar"}`}
                aria-label={`${formatDayLong(day)}: ${isDone ? "cumplido" : "sin marcar"}`}
                aria-pressed={isDone}
                className={`h-4 min-w-0 flex-1 rounded-[3px] border transition-colors duration-200 sm:h-[18px] ${
                  isDone ? filled : "border-white/[0.04] bg-[#1a1a1a] hover:bg-[#262626]"
                }`}
              />
            );
          })}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={onToggleToday}
          title={`Hoy, ${formatDayLong(today)}`}
          aria-label={`Hoy: ${todayDone ? "cumplido" : "sin marcar"}`}
          aria-pressed={todayDone}
          className={`h-6 w-8 shrink-0 rounded-md border-[1.5px] transition-colors duration-200 sm:h-7 sm:w-9 ${
            todayDone ? filled : "border-[#5a5a5a] bg-transparent hover:border-[#8a8a8a]"
          }`}
        />
      </div>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState, type HTMLAttributes } from "react";
import { GOLD_CONFETTI, MINT_CONFETTI, burstFrom } from "@/lib/confetti";
import type { DayKey, Habit } from "@/lib/data/types";
import { sfx } from "@/lib/sound";
import { useAppStore } from "@/lib/store/useAppStore";
import { currentStreak, longestStreak } from "@/lib/streak";
import { useConfirm } from "../ui/ConfirmProvider";
import { BoltIcon, GripIcon, XIcon } from "../ui/icons";
import { InlineEdit } from "../ui/InlineEdit";
import { LinkChip } from "../ui/LinkChip";
import { CompleteButton } from "./CompleteButton";
import { DaysStrip } from "./DaysStrip";
import { RewardChip } from "./RewardChip";
import { StreakDisplay } from "./StreakDisplay";

interface Props {
  habit: Habit;
  today: DayKey;
  onReward: (habit: Habit) => void;
  onPriorityChange: (id: string) => void;
  /** Props for the drag handle (from @dnd-kit). */
  handleProps?: HTMLAttributes<HTMLButtonElement> & { ref?: (el: HTMLElement | null) => void };
  dragging?: boolean;
}

export function HabitCard({ habit, today, onReward, onPriorityChange, handleProps, dragging }: Props) {
  const updateHabit = useAppStore((s) => s.updateHabit);
  const removeHabit = useAppStore((s) => s.removeHabit);
  const setCompletion = useAppStore((s) => s.setCompletion);
  const confirm = useConfirm();
  const circle = useRef<HTMLButtonElement>(null);
  const [celebrateKey, setCelebrateKey] = useState(0);

  const doneToday = habit.completions.includes(today);
  const current = useMemo(() => currentStreak(habit.completions, today), [habit.completions, today]);
  const longest = useMemo(() => longestStreak(habit.completions, today), [habit.completions, today]);
  const { priority } = habit;

  const toggleToday = () => {
    if (doneToday) {
      setCompletion(habit.id, today, false);
      sfx.undo();
      return;
    }
    setCompletion(habit.id, today, true);
    setCelebrateKey((k) => k + 1);
    if (priority) sfx.completeGold();
    else sfx.complete();
    if (habit.reward) {
      burstFrom(circle.current, priority ? GOLD_CONFETTI : MINT_CONFETTI);
      setTimeout(() => onReward(habit), 650);
    }
  };

  const togglePast = (day: DayKey, done: boolean) => {
    setCompletion(habit.id, day, done);
    if (done) sfx.tick();
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "¿Borrar este hábito?",
      message: `«${habit.name}» y todo su historial de días se borrarán.`,
      confirmLabel: "Borrar",
      danger: true,
    });
    if (ok) removeHabit(habit.id);
  };

  return (
    <article
      id={`habit-${habit.id}`}
      className={`relative overflow-hidden rounded-2xl border p-4 transition-[border-color,box-shadow] duration-300 sm:p-5 ${
        priority
          ? "border-gold/60 bg-[linear-gradient(180deg,#15120b_0%,#0e0d0a_100%)] shadow-[0_0_0_1px_rgb(251_191_36/0.08),0_0_42px_rgb(251_191_36/0.1)]"
          : "border-line bg-[linear-gradient(180deg,#121212_0%,#0d0d0d_100%)]"
      } ${dragging ? "shadow-[0_24px_60px_rgb(0_0_0/0.7)] ring-1 ring-white/15" : ""}`}
    >
      {priority && (
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full bg-gold/[0.07] blur-3xl" />
      )}

      {/* Header */}
      <div className="relative flex items-start gap-2.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.8, rotate: -12 }}
          onClick={() => onPriorityChange(habit.id)}
          aria-pressed={priority}
          aria-label={priority ? "Quitar prioridad" : "Marcar como prioritario"}
          title={priority ? "Quitar prioridad" : "Marcar como prioritario"}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
            priority
              ? "border-gold/70 bg-gold/15 text-gold shadow-[0_0_14px_rgb(251_191_36/0.35)]"
              : "border-[#3a2c22] bg-[#17120f] text-[#c2703d] hover:border-gold/50 hover:text-gold"
          }`}
        >
          <BoltIcon size={14} />
        </motion.button>

        <div className="min-w-0 flex-1">
          <InlineEdit
            value={habit.name}
            onSave={(name) => void updateHabit(habit.id, { name })}
            ariaLabel="Nombre del hábito"
            className={`text-[15px] leading-snug font-bold sm:text-base ${priority ? "text-gold-soft" : "text-ink"}`}
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <RewardChip reward={habit.reward} onSave={(reward) => void updateHabit(habit.id, { reward })} />
            <HabitLinkChip habit={habit} />
          </div>
        </div>

        <div className="-mt-1 -mr-1 flex shrink-0 items-center">
          <button
            type="button"
            {...handleProps}
            aria-label="Arrastrar para reordenar"
            title="Arrastrar para reordenar"
            className="cursor-grab touch-none rounded-md p-1.5 text-faint transition hover:bg-white/5 hover:text-soft active:cursor-grabbing"
          >
            <GripIcon size={16} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Borrar hábito"
            title="Borrar hábito"
            className="rounded-md p-1.5 text-faint transition hover:bg-white/5 hover:text-rose-300"
          >
            <XIcon size={15} />
          </button>
        </div>
      </div>

      {/* Circle + streak */}
      <div className="relative mt-4 flex items-center justify-center gap-5 sm:gap-7">
        <div className="flex flex-col items-center">
          <CompleteButton
            ref={circle}
            done={doneToday}
            priority={priority}
            celebrateKey={celebrateKey}
            onToggle={toggleToday}
            label={doneToday ? `Desmarcar hoy: ${habit.name}` : `Completar hoy: ${habit.name}`}
          />
          <div className="mt-3 h-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={doneToday ? "done" : "todo"}
                initial={{ opacity: 0, y: 6, scale: doneToday ? 1.3 : 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`label ${doneToday ? (priority ? "!text-gold" : "!text-mint") : priority ? "!text-gold/70" : "!text-soft/60"}`}
              >
                {doneToday ? "¡Hecho hoy!" : "Toca para completar"}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <StreakDisplay current={current} longest={longest} priority={priority} doneToday={doneToday} />
      </div>

      <div className="relative mt-5">
        <DaysStrip
          completions={habit.completions}
          today={today}
          priority={priority}
          onTogglePast={togglePast}
          onToggleToday={toggleToday}
        />
      </div>
    </article>
  );
}

function HabitLinkChip({ habit }: { habit: Habit }) {
  const link = habit.link;
  const goal = useAppStore((s) =>
    link?.kind === "input" ? s.goals.find((g) => g.id === link.goalId) : undefined,
  );
  const boss = useAppStore((s) =>
    link?.kind === "solution" ? s.bosses.find((b) => b.id === link.bossId) : undefined,
  );

  if (link?.kind === "input" && goal) {
    return (
      <LinkChip href={`/ley-causal#input-${link.inputId}`} icon="🎯" title="Input de la Ley Causal">
        Ley Causal: {goal.effect || "objetivo"}
      </LinkChip>
    );
  }
  if (link?.kind === "solution" && boss) {
    return (
      <LinkChip href={`/jefe?boss=${boss.id}#entry-${link.entryId}`} icon="👾" title="Solución contra un jefe">
        Jefe {boss.number}: {boss.name}
      </LinkChip>
    );
  }
  return null;
}

"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { CausalInput, InputStatus } from "@/lib/data/types";
import { sfx } from "@/lib/sound";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToast";
import { currentStreak } from "@/lib/streak";
import { useToday } from "@/lib/useToday";
import { NewBossDialog } from "../boss/NewBossDialog";
import { useConfirm } from "../ui/ConfirmProvider";
import { CheckIcon, XIcon } from "../ui/icons";
import { InlineEdit } from "../ui/InlineEdit";
import { LinkChip } from "../ui/LinkChip";

const STATUS: Record<InputStatus, { label: string; className: string; next: InputStatus }> = {
  pending: { label: "Pendiente", className: "border-line-strong text-muted", next: "in_progress" },
  in_progress: { label: "En curso", className: "border-sky-400/40 bg-sky-400/10 text-sky-300", next: "done" },
  done: { label: "Hecho", className: "border-mint/40 bg-mint/10 text-mint", next: "pending" },
};

export function InputRow({ goalId, input }: { goalId: string; input: CausalInput }) {
  const updateInput = useAppStore((s) => s.updateInput);
  const removeInput = useAppStore((s) => s.removeInput);
  const convertInputToHabit = useAppStore((s) => s.convertInputToHabit);
  const createBossFromInput = useAppStore((s) => s.createBossFromInput);
  const habit = useAppStore((s) => (input.habitId ? s.habits.find((h) => h.id === input.habitId) : undefined));
  const boss = useAppStore((s) => (input.bossId ? s.bosses.find((b) => b.id === input.bossId) : undefined));
  const today = useToday();
  const confirm = useConfirm();
  const [bossDialog, setBossDialog] = useState(false);

  const done = input.status === "done";
  const habitStreak = habit ? currentStreak(habit.completions, today) : 0;
  const setStatus = (status: InputStatus) => {
    void updateInput(goalId, input.id, { status });
    if (status === "done") sfx.tick();
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "¿Borrar este input?",
      message: habit || boss ? "El hábito y el jefe vinculados se conservan, solo se pierde el enlace." : undefined,
      confirmLabel: "Borrar",
      danger: true,
    });
    if (ok) removeInput(goalId, input.id);
  };

  const suggestedBossName = `No ${input.text.charAt(0).toLowerCase()}${input.text.slice(1)}`;

  return (
    <motion.li
      id={`input-${input.id}`}
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group rounded-xl border border-line bg-[#0b0b0b] p-2.5 sm:p-3"
    >
      <div className="flex items-start gap-2.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.8 }}
          onClick={() => setStatus(done ? "pending" : "done")}
          role="checkbox"
          aria-checked={done}
          aria-label={done ? "Marcar como pendiente" : "Marcar como hecho"}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
            done ? "border-mint bg-mint text-[#053b35] shadow-[0_0_10px_rgb(94_234_212/0.5)]" : "border-[#4a4a4a] hover:border-mint/60"
          }`}
        >
          {done && <CheckIcon size={13} strokeWidth={3} />}
        </motion.button>

        <div className="min-w-0 flex-1">
          <InlineEdit
            value={input.text}
            onSave={(text) => void updateInput(goalId, input.id, { text })}
            ariaLabel="Input"
            className={`text-[14.5px] leading-snug ${done ? "text-muted line-through decoration-mint/50" : "text-ink"}`}
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatus(STATUS[input.status].next)}
              title="Cambiar estado"
              className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] uppercase transition ${STATUS[input.status].className}`}
            >
              {STATUS[input.status].label}
            </button>

            {habit ? (
              <LinkChip href={`/habitos#habit-${habit.id}`} icon="⚡" title="Hábito vinculado" className="!border-mint/25 !text-mint/90">
                Hábito{habitStreak > 0 ? ` · 🔥 ${habitStreak}` : ""}
              </LinkChip>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const created = convertInputToHabit(goalId, input.id);
                  if (created) toast(`Hábito creado: «${created.name}» ⚡`, "success");
                }}
                className="chip"
              >
                → Convertir en hábito
              </button>
            )}

            {boss ? (
              <LinkChip
                href={`/jefe?boss=${boss.id}`}
                icon="👾"
                title="Jefe vinculado"
                className={boss.defeatedAt ? "!border-gold/30 !text-gold-soft" : "!border-[#ff4d6d]/30 !text-[#ff8197]"}
              >
                Jefe {boss.number}: {boss.name}
                {boss.defeatedAt ? " · derrotado" : ""}
              </LinkChip>
            ) : (
              <button type="button" onClick={() => setBossDialog(true)} className="chip hover:!border-[#ff4d6d]/40 hover:!text-[#ff8197]">
                → ¿Qué me frena? Crear jefe
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          aria-label="Borrar input"
          className="hover-reveal rounded-md p-1 text-faint transition hover:bg-white/5 hover:text-rose-300"
        >
          <XIcon size={13} />
        </button>
      </div>

      <NewBossDialog
        open={bossDialog}
        onClose={() => setBossDialog(false)}
        initialName={suggestedBossName}
        context={`Input: «${input.text}». ¿Qué te impide hacerlo?`}
        onCreate={(name, spriteId) => {
          const created = createBossFromInput(goalId, input.id, name, spriteId);
          if (created) toast(`Jefe ${created.number} invocado: «${created.name}» 👾`, "success");
        }}
      />
    </motion.li>
  );
}

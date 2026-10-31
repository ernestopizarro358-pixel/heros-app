"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import type { CausalGoal } from "@/lib/data/types";
import { diffDays, formatDayLong } from "@/lib/date";
import { useAppStore } from "@/lib/store/useAppStore";
import { useToday } from "@/lib/useToday";
import { AutosaveTextarea } from "../ui/AutosaveTextarea";
import { useConfirm } from "../ui/ConfirmProvider";
import { ArrowRightIcon, PlusIcon, StarIcon, TrashIcon } from "../ui/icons";
import { InputRow } from "./InputRow";

/** One causal goal: ESTADO INICIAL → INPUTS (CAUSAS) → EFECTO (OUTPUT). */
export function GoalCard({ goal }: { goal: CausalGoal }) {
  const updateGoal = useAppStore((s) => s.updateGoal);
  const toggleMainGoal = useAppStore((s) => s.toggleMainGoal);
  const removeGoal = useAppStore((s) => s.removeGoal);
  const addInput = useAppStore((s) => s.addInput);
  const confirm = useConfirm();
  const today = useToday();
  const [newInput, setNewInput] = useState("");

  const total = goal.inputs.length;
  const done = goal.inputs.filter((i) => i.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const daysLeft = goal.targetDate ? diffDays(goal.targetDate, today) : null;

  const handleDelete = async () => {
    const ok = await confirm({
      title: "¿Borrar este objetivo causal?",
      message: "Se borrarán su estado inicial, efecto e inputs. Los hábitos y jefes creados desde aquí se conservan.",
      confirmLabel: "Borrar",
      danger: true,
    });
    if (ok) removeGoal(goal.id);
  };

  const submitInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInput.trim()) return;
    addInput(goal.id, newInput);
    setNewInput("");
  };

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-6 ${
        goal.isMain
          ? "border-gold/50 bg-[linear-gradient(180deg,#14110a_0%,#0d0c09_100%)] shadow-[0_0_50px_rgb(251_191_36/0.08)]"
          : "border-line bg-[linear-gradient(180deg,#111_0%,#0d0d0d_100%)]"
      }`}
    >
      {goal.isMain && (
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.8, rotate: -20 }}
            onClick={() => toggleMainGoal(goal.id)}
            aria-pressed={goal.isMain}
            title={goal.isMain ? "Quitar como principal" : "Marcar como objetivo principal"}
            className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${
              goal.isMain ? "border-gold/70 bg-gold/15 text-gold shadow-[0_0_14px_rgb(251_191_36/0.35)]" : "border-line-strong text-faint hover:text-gold"
            }`}
          >
            <StarIcon size={14} fill={goal.isMain ? "currentColor" : "none"} />
          </motion.button>
          <p className={`label ${goal.isMain ? "!text-gold" : ""}`}>{goal.isMain ? "Objetivo principal" : "Objetivo causal"}</p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Borrar objetivo"
          title="Borrar objetivo"
          className="rounded-md p-1.5 text-faint transition hover:bg-white/5 hover:text-rose-300"
        >
          <TrashIcon size={14} />
        </button>
      </div>

      {/* Flow */}
      <div className="relative mt-4 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.5fr)_auto_minmax(0,1fr)] lg:gap-3">
        <FlowBlock label="Estado inicial" tone="slate">
          <AutosaveTextarea
            value={goal.initialState}
            onSave={(initialState) => updateGoal(goal.id, { initialState })}
            placeholder="¿Dónde estás hoy respecto a este efecto? Ej. No tengo clientes recurrentes, facturo $0/mes."
            minRows={3}
            ariaLabel="Estado inicial"
            className="!text-[15px] !leading-relaxed"
            indicatorClassName="absolute -bottom-5 right-0"
          />
        </FlowBlock>

        <Connector />

        <FlowBlock label="Inputs (causas)" tone="mint" aside={total > 0 ? `${done}/${total}` : undefined}>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {goal.inputs.map((input) => (
                <InputRow key={input.id} goalId={goal.id} input={input} />
              ))}
            </AnimatePresence>
          </ul>
          <form onSubmit={submitInput} className={`flex gap-1.5 ${total > 0 ? "mt-2.5" : ""}`}>
            <input
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              maxLength={200}
              placeholder={total === 0 ? "Ej. Contactar 20 negocios por WhatsApp al día" : "Añade otro input…"}
              aria-label="Nuevo input"
              className="field min-w-0 flex-1 !py-2 !text-[13.5px]"
            />
            <button type="submit" disabled={!newInput.trim()} aria-label="Añadir input" className="btn btn-ghost !px-3">
              <PlusIcon size={15} />
            </button>
          </form>
        </FlowBlock>

        <Connector />

        <FlowBlock label="Efecto (output)" tone="gold">
          <AutosaveTextarea
            value={goal.effect}
            onSave={(effect) => updateGoal(goal.id, { effect })}
            placeholder="¿Qué quieres lograr? Concreto y medible. Ej. Nexora vende $2.000/mes."
            minRows={2}
            ariaLabel="Efecto"
            className="!text-[17px] !leading-snug font-bold !text-gold-soft"
            indicatorClassName="absolute -bottom-5 right-0"
          />
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
            <label className="label" htmlFor={`target-${goal.id}`}>
              Fecha objetivo
            </label>
            <input
              id={`target-${goal.id}`}
              type="date"
              value={goal.targetDate ?? ""}
              onChange={(e) => void updateGoal(goal.id, { targetDate: e.target.value || null })}
              className="field w-auto !px-2 !py-1 !text-xs [color-scheme:dark]"
            />
          </div>
          {goal.targetDate && daysLeft !== null && (
            <p className="mt-1.5 text-xs text-muted" title={formatDayLong(goal.targetDate)}>
              {daysLeft > 0 ? `Faltan ${daysLeft} días` : daysLeft === 0 ? "Es hoy" : `Venció hace ${-daysLeft} días`}
            </p>
          )}
        </FlowBlock>
      </div>

      {/* Progress */}
      <div className="relative mt-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className={`h-full rounded-full ${
              pct === 100
                ? "bg-[linear-gradient(90deg,#f59e0b,#fbbf24)] shadow-[0_0_12px_rgb(251_191_36/0.6)]"
                : "bg-[linear-gradient(90deg,#14b8a6,#5eead4)] shadow-[0_0_10px_rgb(94_234_212/0.4)]"
            }`}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <span className={`font-mono text-xs font-semibold tabular-nums ${pct === 100 ? "text-gold" : "text-soft"}`}>{pct}%</span>
      </div>
      <p className="relative mt-1 text-[11px] text-faint">
        {total === 0 ? "Añade los inputs que producen el efecto." : `${done} de ${total} inputs hechos`}
      </p>
    </motion.article>
  );
}

const TONES = {
  slate: { label: "!text-[#9aa7b8]", border: "border-[#2a3038]", bg: "bg-[#0d0f12]" },
  mint: { label: "!text-mint", border: "border-mint/20", bg: "bg-[#0b100f]" },
  gold: { label: "!text-gold", border: "border-gold/25", bg: "bg-[#12100a]" },
};

function FlowBlock({
  label,
  tone,
  aside,
  children,
}: {
  label: string;
  tone: keyof typeof TONES;
  aside?: string;
  children: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl border p-3.5 pb-6 ${t.border} ${t.bg}`}>
      <div className="mb-2.5 flex items-center justify-between">
        <p className={`label ${t.label}`}>{label}</p>
        {aside && <span className="font-mono text-[10px] text-muted">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center py-0.5 lg:py-0" aria-hidden>
      <span className="flex h-7 w-7 rotate-90 items-center justify-center rounded-full border border-line-strong bg-[#0f0f0f] text-muted shadow-[0_0_14px_rgb(0_0_0/0.6)] lg:rotate-0">
        <ArrowRightIcon size={13} />
      </span>
    </div>
  );
}

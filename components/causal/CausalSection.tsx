"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useHashFocus } from "@/lib/useHashFocus";
import { PlusIcon } from "../ui/icons";
import { SectionTitle } from "../ui/SectionTitle";
import { GoalCard } from "./GoalCard";

export function CausalSection() {
  const goals = useAppStore((s) => s.goals);
  const addGoal = useAppStore((s) => s.addGoal);
  useHashFocus();

  // The main goal is always shown first, highlighted.
  const sorted = useMemo(
    () => [...goals].sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.createdAt.localeCompare(b.createdAt)),
    [goals],
  );

  const create = () => {
    const goal = addGoal();
    setTimeout(() => {
      const el = document.getElementById(`goal-${goal.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true });
    }, 120);
  };

  return (
    <section>
      <SectionTitle
        color="#d4a54a"
        action={
          <button type="button" onClick={create} className="chip hover:!border-gold/50 hover:!text-gold">
            <PlusIcon size={12} /> Nuevo objetivo
          </button>
        }
      >
        Ley causal
      </SectionTitle>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-2xl border border-line bg-[radial-gradient(ellipse_at_top,#16130b_0%,#0c0c0c_65%)] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase">
          <span className="rounded-lg border border-[#2a3038] bg-[#0d0f12] px-2.5 py-1.5 text-[#9aa7b8]">Estado inicial</span>
          <span className="text-faint">+</span>
          <span className="rounded-lg border border-mint/25 bg-[#0b100f] px-2.5 py-1.5 text-mint">Causas (inputs)</span>
          <span className="text-faint">→</span>
          <span className="rounded-lg border border-gold/30 bg-[#12100a] px-2.5 py-1.5 text-gold">Efecto</span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-soft">
          Este es el mapa. Define el efecto que quieres, dónde estás hoy y las acciones concretas que transforman uno en
          otro. Después conviértelas en <span className="text-mint">hábitos</span>, y si sabes qué hacer pero no lo haces,
          crea el <span className="text-[#ff8197]">jefe</span> que te frena.
        </p>
      </motion.div>

      <div className="mt-6 space-y-5">
        <AnimatePresence initial={false}>
          {sorted.map((goal) => (
            <div key={goal.id} id={`goal-${goal.id}`} className="scroll-mt-6">
              <GoalCard goal={goal} />
            </div>
          ))}
        </AnimatePresence>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
            <p className="text-lg font-bold">¿Qué efecto quieres producir?</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              Ej. «Tener una empresa que facture $2.000/mes». Empieza por ahí y luego define las causas.
            </p>
            <button type="button" onClick={create} className="btn btn-light mt-5">
              <PlusIcon size={15} /> Crear mi primer objetivo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={create}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-4 text-sm text-muted transition hover:border-gold/40 hover:text-gold"
          >
            <PlusIcon size={15} /> Nuevo objetivo causal
          </button>
        )}
      </div>
    </section>
  );
}

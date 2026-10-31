"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { EntryType, SolutionSize } from "@/lib/data/types";
import { ENTRY_META, SOLUTION_DAMAGE, SOLUTION_SIZE_LABEL, WRITE_DAMAGE } from "@/lib/game.config";
import type { NewEntry } from "@/lib/store/useAppStore";
import { AutoTextarea } from "../ui/AutoTextarea";
import { SwordIcon } from "../ui/icons";
import { ENTRY_STYLE } from "./entryStyles";

const TYPES: EntryType[] = ["belief", "learning", "solution"];
const SIZES: SolutionSize[] = ["small", "medium", "large"];

export function AttackBar({ onAttack, disabled }: { onAttack: (entry: NewEntry) => void; disabled?: boolean }) {
  const [type, setType] = useState<EntryType>("belief");
  const [text, setText] = useState("");
  const [size, setSize] = useState<SolutionSize>("medium");
  const [target, setTarget] = useState("");

  const submit = () => {
    if (!text.trim() || disabled) return;
    const counter = Number.parseInt(target, 10);
    onAttack({ type, text, size, target: type === "solution" && counter > 1 ? counter : null });
    setText("");
    setTarget("");
  };

  const damageHint =
    type === "solution"
      ? `Hará −${SOLUTION_DAMAGE[size]} HP solo cuando la cumplas.`
      : `−${WRITE_DAMAGE[type]} HP al escribirla.`;

  return (
    <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de entrada">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${
              type === t ? ENTRY_STYLE[t].active : "border-line-strong text-muted hover:text-soft"
            }`}
          >
            <span className="font-mono text-[10px] font-bold tracking-[0.15em]">{ENTRY_META[t].tag}</span>
            {ENTRY_META[t].label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-muted">
        {ENTRY_META[type].hint} <span className="text-soft">{damageHint}</span>
      </p>

      <AnimatePresence initial={false}>
        {type === "solution" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 pt-3">
              <span className="label">Tamaño</span>
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                    size === s ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200" : "border-line-strong text-muted hover:text-soft"
                  }`}
                >
                  {SOLUTION_SIZE_LABEL[s]} · {SOLUTION_DAMAGE[s]} HP
                </button>
              ))}
              <label className="ml-auto flex items-center gap-2 text-xs text-muted">
                Contador (opcional)
                <input
                  type="number"
                  min={2}
                  max={999}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="ej. 30"
                  className="field w-20 !px-2 !py-1 !text-xs"
                />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="field min-w-0 flex-1 !py-2.5">
          <AutoTextarea
            minRows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Escribe tu golpe y ataca… (Ctrl+Enter)"
            aria-label="Texto del ataque"
            className="text-[15px] leading-relaxed placeholder:text-[#55555a]"
          />
        </div>
        <motion.button
          type="button"
          onClick={submit}
          disabled={!text.trim() || disabled}
          whileTap={{ scale: 0.94 }}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#e11d48,#9f1239)] px-6 font-mono text-[12px] font-bold tracking-[0.2em] text-white shadow-[0_0_24px_rgb(225_29_72/0.35),inset_0_1px_0_rgb(255_255_255/0.2)] transition hover:shadow-[0_0_34px_rgb(225_29_72/0.55)] disabled:opacity-40 disabled:shadow-none"
        >
          <SwordIcon size={15} /> ATACAR
        </motion.button>
      </div>
    </div>
  );
}

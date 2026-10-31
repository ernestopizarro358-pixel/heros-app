"use client";

import { motion } from "framer-motion";
import { entryDamage, isSolutionDone } from "@/lib/boss";
import type { BossEntry } from "@/lib/data/types";
import { formatTimestampLong } from "@/lib/date";
import { ENTRY_META, SOLUTION_DAMAGE, SOLUTION_SIZE_LABEL } from "@/lib/game.config";
import { CheckIcon, XIcon } from "../ui/icons";
import { LinkChip } from "../ui/LinkChip";
import { ENTRY_STYLE } from "./entryStyles";

export interface EntryActions {
  onDelete: (entry: BossEntry) => void;
  onToggleDone: (entry: BossEntry, done: boolean) => void;
  onProgress: (entry: BossEntry, progress: number) => void;
  onConvertToHabit: (entry: BossEntry) => void;
}

export function EntryItem({ entry, actions }: { entry: BossEntry; actions?: EntryActions }) {
  const style = ENTRY_STYLE[entry.type];
  const damage = entryDamage(entry);

  return (
    <motion.li
      id={`entry-${entry.id}`}
      layout="position"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
      className={`group relative flex gap-3 rounded-xl border border-l-2 border-line bg-[#0c0c0c] p-3.5 sm:p-4 ${style.border}`}
    >
      <span
        className={`mt-0.5 h-fit shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.15em] ${style.tag}`}
        title={ENTRY_META[entry.type].label}
      >
        {ENTRY_META[entry.type].tag}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap text-ink">{entry.text}</p>
        <p className="mt-1.5 font-mono text-[10px] text-faint sm:hidden">{formatTimestampLong(entry.createdAt)}</p>
        {entry.type === "solution" && <SolutionMeta entry={entry} actions={actions} />}
      </div>

      <div className="flex shrink-0 items-start gap-1">
        <div className="hidden text-right sm:block">
          <p className="font-mono text-[10px] whitespace-nowrap text-faint">{formatTimestampLong(entry.createdAt)}</p>
          {damage > 0 && <p className="mt-1 font-mono text-[10px] text-[#ff4d6d]/80">−{damage} HP</p>}
        </div>
        {actions && (
          <button
            type="button"
            onClick={() => actions.onDelete(entry)}
            aria-label="Borrar entrada"
            title="Borrar entrada (el jefe recupera su HP)"
            className="-mt-1 -mr-1 rounded-md p-1.5 text-faint transition hover:bg-white/5 hover:text-rose-300"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>
    </motion.li>
  );
}

function SolutionMeta({ entry, actions }: { entry: BossEntry; actions?: EntryActions }) {
  const done = isSolutionDone(entry);
  const full = SOLUTION_DAMAGE[entry.size ?? "small"];
  const target = entry.target ?? null;
  const progress = Math.min(entry.progress ?? 0, target ?? 0);

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.14em] ${
          done ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-line-strong text-muted"
        }`}
      >
        {done ? `CUMPLIDA · −${full} HP` : `PENDIENTE · ${SOLUTION_SIZE_LABEL[entry.size ?? "small"].toUpperCase()} ${full} HP`}
      </span>

      {target && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              initial={false}
              animate={{ width: `${(progress / target) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-soft tabular-nums">
            {progress}/{target}
          </span>
          {actions && (
            <>
              <button
                type="button"
                disabled={progress <= 0}
                onClick={() => actions.onProgress(entry, progress - 1)}
                aria-label="Restar un avance"
                className="h-6 w-6 rounded-md border border-line-strong text-xs text-muted hover:text-ink disabled:opacity-30"
              >
                −
              </button>
              <button
                type="button"
                disabled={done}
                onClick={() => actions.onProgress(entry, progress + 1)}
                className="h-6 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-30"
              >
                +1
              </button>
            </>
          )}
        </div>
      )}

      {actions && !target && (
        done ? (
          <button type="button" onClick={() => actions.onToggleDone(entry, false)} className="text-xs text-muted underline-offset-2 hover:text-soft hover:underline">
            Deshacer
          </button>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => actions.onToggleDone(entry, true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200 shadow-[0_0_14px_rgb(52_211_153/0.15)] transition hover:bg-emerald-400/20"
          >
            <CheckIcon size={13} /> Marcar cumplida
          </motion.button>
        )
      )}

      {entry.habitId ? (
        <LinkChip href={`/habitos#habit-${entry.habitId}`} icon="⚡">
          Hábito
        </LinkChip>
      ) : (
        actions && (
          <button type="button" onClick={() => actions.onConvertToHabit(entry)} className="chip">
            → Convertir en hábito
          </button>
        )
      )}
    </div>
  );
}

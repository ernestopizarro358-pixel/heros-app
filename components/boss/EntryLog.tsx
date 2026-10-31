"use client";

import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { bossSummary } from "@/lib/boss";
import type { Boss, EntryType } from "@/lib/data/types";
import { ENTRY_META } from "@/lib/game.config";
import { EntryItem, type EntryActions } from "./EntryItem";

type Filter = "all" | EntryType;
const FILTERS: Filter[] = ["all", "belief", "learning", "solution"];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function EntryLog({ boss, actions }: { boss: Boss; actions?: EntryActions }) {
  const [filter, setFilter] = useState<Filter>("all");
  const summary = bossSummary(boss);

  const entries = useMemo(
    () =>
      [...boss.entries]
        .filter((e) => filter === "all" || e.type === filter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [boss.entries, filter],
  );

  const count = (f: Filter) => (f === "all" ? boss.entries.length : boss.entries.filter((e) => e.type === f).length);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtrar registro">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-2.5 py-1 font-mono text-[10.5px] font-semibold tracking-[0.14em] transition ${
                filter === f ? "bg-white/10 text-ink" : "text-faint hover:text-soft"
              }`}
            >
              {f === "all" ? "TODAS" : ENTRY_META[f].tag} <span className="opacity-60">{count(f)}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          <span className="text-rose-400">{plural(summary.beliefs, "creencia limitante", "creencias limitantes")}</span> ·{" "}
          <span className="text-amber-300">{plural(summary.learnings, "aprendizaje", "aprendizajes")}</span> ·{" "}
          <span className="text-emerald-300">
            {plural(summary.solutionsDone, "solución cumplida", "soluciones cumplidas")}
          </span>{" "}
          / {summary.solutionsPending} {summary.solutionsPending === 1 ? "pendiente" : "pendientes"}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
          {boss.entries.length === 0
            ? "Todavía no hay golpes. Empieza por la creencia limitante que mantiene vivo a este jefe."
            : "No hay entradas de este tipo."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <EntryItem key={entry.id} entry={entry} actions={actions} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

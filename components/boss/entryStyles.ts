import type { EntryType } from "@/lib/data/types";

/** Colour language of the three entry types (CRE red, APR amber, SOL green). */
export const ENTRY_STYLE: Record<EntryType, { tag: string; border: string; active: string }> = {
  belief: {
    tag: "border-rose-500/70 text-rose-400",
    border: "border-l-rose-500/80",
    active: "border-rose-500/60 bg-rose-500/10 text-rose-300",
  },
  learning: {
    tag: "border-amber-400/70 text-amber-300",
    border: "border-l-amber-400/80",
    active: "border-amber-400/60 bg-amber-400/10 text-amber-200",
  },
  solution: {
    tag: "border-emerald-400/70 text-emerald-300",
    border: "border-l-emerald-400/80",
    active: "border-emerald-400/60 bg-emerald-400/10 text-emerald-200",
  },
};

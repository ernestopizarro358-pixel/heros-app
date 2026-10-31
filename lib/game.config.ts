import type { EntryType, SolutionSize } from "./data/types";

/**
 * Tunable numbers for Lucha contra el Jefe. Change them here and the whole
 * app (HP bars, damage numbers, summaries) follows.
 */

export const BOSS_MAX_HP = 100;

/** Damage applied the moment the entry is written. */
export const WRITE_DAMAGE: Record<Exclude<EntryType, "solution">, number> = {
  belief: 2,
  learning: 1,
};

/** Damage applied only when a solution is fulfilled (proportionally if it has a counter). */
export const SOLUTION_DAMAGE: Record<SolutionSize, number> = {
  small: 10,
  medium: 20,
  large: 35,
};

/** Pixel-art sprites available for bosses (see components/boss/sprites.ts). */
export const BOSS_SPRITE_IDS = ["knight", "demon", "wraith", "golem", "slime"] as const;

export const SOLUTION_SIZE_LABEL: Record<SolutionSize, string> = {
  small: "Pequeña",
  medium: "Mediana",
  large: "Grande",
};

export const ENTRY_META: Record<EntryType, { tag: string; label: string; hint: string }> = {
  belief: {
    tag: "CRE",
    label: "Creencia limitante",
    hint: "La creencia falsa que mantiene vivo al jefe. Identificarla ya le hace daño.",
  },
  learning: {
    tag: "APR",
    label: "Aprendizaje",
    hint: "La creencia verdadera que contradice a la limitante.",
  },
  solution: {
    tag: "SOL",
    label: "Solución",
    hint: "Una acción objetiva. Solo hace daño cuando la cumples.",
  },
};

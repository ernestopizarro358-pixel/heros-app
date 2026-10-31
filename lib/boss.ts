import type { Boss, BossEntry } from "./data/types";
import { BOSS_MAX_HP, SOLUTION_DAMAGE, WRITE_DAMAGE } from "./game.config";

export function isSolutionDone(entry: BossEntry): boolean {
  if (entry.type !== "solution") return false;
  if (entry.target) return (entry.progress ?? 0) >= entry.target;
  return !!entry.completedAt;
}

/** HP this entry has taken from the boss so far. */
export function entryDamage(entry: BossEntry): number {
  if (entry.type !== "solution") return WRITE_DAMAGE[entry.type];
  const full = SOLUTION_DAMAGE[entry.size ?? "small"];
  if (entry.target) {
    const progress = Math.min(entry.progress ?? 0, entry.target);
    return Math.round((full * progress) / entry.target);
  }
  return entry.completedAt ? full : 0;
}

/** HP is derived from the entries: deleting an entry gives its damage back. */
export function bossHp(boss: Pick<Boss, "entries">): number {
  const damage = boss.entries.reduce((sum, e) => sum + entryDamage(e), 0);
  return Math.max(0, BOSS_MAX_HP - damage);
}

export function bossSummary(boss: Boss) {
  const solutions = boss.entries.filter((e) => e.type === "solution");
  const done = solutions.filter(isSolutionDone).length;
  return {
    beliefs: boss.entries.filter((e) => e.type === "belief").length,
    learnings: boss.entries.filter((e) => e.type === "learning").length,
    solutionsDone: done,
    solutionsPending: solutions.length - done,
  };
}

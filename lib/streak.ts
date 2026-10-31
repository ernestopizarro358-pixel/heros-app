import { addDays, diffDays } from "./date";
import type { DayKey } from "./data/types";

/**
 * Consecutive days completed ending today. If today isn't marked yet, the
 * streak counts up to yesterday (it isn't broken until the day is over).
 */
export function currentStreak(completions: DayKey[], today: DayKey): number {
  const done = new Set(completions);
  let day = done.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Longest run of consecutive days ever completed (future days are ignored). */
export function longestStreak(completions: DayKey[], today: DayKey): number {
  const days = [...new Set(completions)].filter((d) => d <= today).sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && diffDays(days[i], days[i - 1]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

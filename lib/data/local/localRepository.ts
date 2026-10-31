import { defaultData } from "../defaults";
import { normalizeData } from "../normalize";
import type { DataRepository } from "../repository";
import type { AppData } from "../types";

const STORAGE_KEY = "heroes-app:data";

/** Reads what this browser has saved, without touching the repository cache. `null` if nothing usable. */
export function readLocalSnapshot(): AppData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/**
 * localStorage implementation of the repositories. Keeps a private copy of
 * the whole snapshot and writes it back after every change. Inputs are cloned
 * so the store and the repository never share mutable objects.
 */
export function createLocalRepository(): DataRepository {
  let data: AppData | null = null;

  const read = (): AppData => {
    if (data) return data;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      data = raw ? normalizeData(JSON.parse(raw)) : defaultData();
    } catch (error) {
      console.error("No se pudieron leer los datos guardados", error);
      data = defaultData();
    }
    return data;
  };

  const write = () => {
    if (!data) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  /** Runs a mutation against the cached snapshot and persists it. */
  const mutate = async (fn: (d: AppData) => void): Promise<void> => {
    fn(read());
    write();
  };

  const clone = <T,>(value: T): T => structuredClone(value);

  const board = (d: AppData, kind: "portal" | "antiportal") => d.visions[kind];

  return {
    async load() {
      return clone(read());
    },

    async replaceAll(next) {
      data = clone(next);
      write();
    },

    habits: {
      create: (habit) => mutate((d) => void d.habits.push(clone(habit))),
      update: (id, patch) =>
        mutate((d) => {
          const habit = d.habits.find((h) => h.id === id);
          if (habit) Object.assign(habit, clone(patch));
        }),
      remove: (id) =>
        mutate((d) => {
          d.habits = d.habits.filter((h) => h.id !== id);
        }),
      reorder: (orderedIds) =>
        mutate((d) => {
          orderedIds.forEach((id, position) => {
            const habit = d.habits.find((h) => h.id === id);
            if (habit) habit.position = position;
          });
        }),
      setCompletion: (habitId, day, done) =>
        mutate((d) => {
          const habit = d.habits.find((h) => h.id === habitId);
          if (!habit) return;
          const rest = habit.completions.filter((c) => c !== day);
          habit.completions = done ? [...rest, day] : rest;
        }),
    },

    visions: {
      updateBoard: (kind, patch) => mutate((d) => void Object.assign(board(d, kind), clone(patch))),
      upsertSlide: (kind, slide, position) =>
        mutate((d) => {
          const slides = board(d, kind).slides.filter((s) => s.id !== slide.id);
          slides.splice(position, 0, clone(slide));
          board(d, kind).slides = slides;
        }),
      removeSlide: (kind, slideId) =>
        mutate((d) => {
          board(d, kind).slides = board(d, kind).slides.filter((s) => s.id !== slideId);
        }),
    },

    goals: {
      saveGoal: (goal) =>
        mutate((d) => {
          const index = d.goals.findIndex((g) => g.id === goal.id);
          if (index >= 0) d.goals[index] = clone(goal);
          else d.goals.push(clone(goal));
        }),
      removeGoal: (goalId) =>
        mutate((d) => {
          d.goals = d.goals.filter((g) => g.id !== goalId);
        }),
    },

    bosses: {
      create: (boss) => mutate((d) => void d.bosses.push(clone(boss))),
      update: (id, patch) =>
        mutate((d) => {
          const boss = d.bosses.find((b) => b.id === id);
          if (boss) Object.assign(boss, clone(patch));
        }),
      remove: (id) =>
        mutate((d) => {
          d.bosses = d.bosses.filter((b) => b.id !== id);
        }),
      upsertEntry: (bossId, entry) =>
        mutate((d) => {
          const boss = d.bosses.find((b) => b.id === bossId);
          if (!boss) return;
          const index = boss.entries.findIndex((e) => e.id === entry.id);
          if (index >= 0) boss.entries[index] = clone(entry);
          else boss.entries.push(clone(entry));
        }),
      removeEntry: (bossId, entryId) =>
        mutate((d) => {
          const boss = d.bosses.find((b) => b.id === bossId);
          if (boss) boss.entries = boss.entries.filter((e) => e.id !== entryId);
        }),
    },

    settings: {
      save: (settings) => mutate((d) => void (d.settings = clone(settings))),
    },
  };
}

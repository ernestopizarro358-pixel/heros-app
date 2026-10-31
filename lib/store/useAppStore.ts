"use client";

import { create } from "zustand";
import { getRepository } from "../data";
import type { BossPatch, HabitPatch, VisionBoardPatch } from "../data/repository";
import { emptySlide } from "../data/defaults";
import { normalizeData } from "../data/normalize";
import type {
  AppData,
  Boss,
  BossEntry,
  CausalGoal,
  CausalInput,
  DayKey,
  EntryType,
  Habit,
  Settings,
  SolutionSize,
  VisionKind,
  VisionSlide,
} from "../data/types";
import { todayKey } from "../date";
import { BOSS_SPRITE_IDS } from "../game.config";
import { newId } from "../id";
import { setSoundEnabled } from "../sound";

/**
 * Global client store. Updates are optimistic: state changes immediately and
 * the repository persists in the background. Async actions resolve to `true`
 * once saved (used by the "Guardado ✓" indicators).
 */

type GoalPatch = Partial<Pick<CausalGoal, "effect" | "targetDate" | "initialState">>;
type InputPatch = Partial<Pick<CausalInput, "text" | "status">>;
type SlidePatch = Partial<Pick<VisionSlide, "title" | "text" | "images">>;
type EntryPatch = Partial<
  Pick<BossEntry, "text" | "progress" | "completedAt" | "target" | "size" | "habitId">
>;

export interface NewEntry {
  type: EntryType;
  text: string;
  size?: SolutionSize;
  target?: number | null;
}

interface AppState extends Omit<AppData, "version"> {
  ready: boolean;
  saveError: string | null;
  loadError: string | null;
  hydrate(): Promise<void>;
  /** Re-reads the data when nothing is being saved (e.g. coming back to the tab). */
  refresh(): Promise<void>;
  /** Forgets everything (sign-out). */
  reset(): void;
  dismissSaveError(): void;

  addHabit(name: string, options?: { reward?: string | null; link?: Habit["link"] }): Habit;
  updateHabit(id: string, patch: HabitPatch): Promise<boolean>;
  removeHabit(id: string): void;
  setCompletion(id: string, day: DayKey, done: boolean): void;
  reorderHabits(orderedIds: string[]): void;

  updateVision(kind: VisionKind, patch: VisionBoardPatch): Promise<boolean>;
  updateSlide(kind: VisionKind, slideId: string, patch: SlidePatch): Promise<boolean>;
  addSlide(kind: VisionKind): VisionSlide;
  removeSlide(kind: VisionKind, slideId: string): void;

  addGoal(): CausalGoal;
  updateGoal(id: string, patch: GoalPatch): Promise<boolean>;
  toggleMainGoal(id: string): void;
  removeGoal(id: string): void;
  addInput(goalId: string, text: string): void;
  updateInput(goalId: string, inputId: string, patch: InputPatch): Promise<boolean>;
  removeInput(goalId: string, inputId: string): void;
  convertInputToHabit(goalId: string, inputId: string): Habit | null;
  createBossFromInput(goalId: string, inputId: string, name: string, spriteId?: string): Boss | null;

  addBoss(name: string, options?: { sourceInput?: Boss["sourceInput"]; spriteId?: string }): Boss;
  updateBoss(id: string, patch: BossPatch): Promise<boolean>;
  removeBoss(id: string): void;
  addEntry(bossId: string, entry: NewEntry): BossEntry;
  updateEntry(bossId: string, entryId: string, patch: EntryPatch): Promise<boolean>;
  removeEntry(bossId: string, entryId: string): void;
  convertSolutionToHabit(bossId: string, entryId: string): Habit | null;

  updateSettings(patch: Partial<Settings>): Promise<boolean>;
  exportData(): AppData;
  importData(raw: unknown): Promise<void>;
}

const repo = () => getRepository();

/** Sprites rotate so each new boss looks different. */
export const nextSpriteId = (number: number) => BOSS_SPRITE_IDS[(number - 1) % BOSS_SPRITE_IDS.length];

export const useAppStore = create<AppState>()((set, get) => {
  /** Counts writes so a background refresh can tell its snapshot went stale. */
  let writes = 0;
  let pending = 0;
  let hydrating: Promise<void> | null = null;

  /** Runs a persistence call, reporting failures without breaking the UI. */
  const persist = (work: Promise<void>): Promise<boolean> => {
    writes++;
    pending++;
    return work.then(
      () => {
        pending--;
        return true;
      },
      (error) => {
        pending--;
        console.error(error);
        set({ saveError: "No se pudo guardar el último cambio. Exporta tus datos como respaldo." });
        return false;
      },
    );
  };

  const goal = (id: string) => get().goals.find((g) => g.id === id);
  const boss = (id: string) => get().bosses.find((b) => b.id === id);

  const replaceGoal = (next: CausalGoal) => {
    set({ goals: get().goals.map((g) => (g.id === next.id ? next : g)) });
    return persist(repo().goals.saveGoal(next));
  };

  const replaceBoss = (next: Boss) =>
    set({ bosses: get().bosses.map((b) => (b.id === next.id ? next : b)) });

  /** Removes references to deleted habits/bosses/inputs from the other sections. */
  const unlinkInputs = (predicate: (input: CausalInput) => Partial<CausalInput> | null) => {
    for (const g of get().goals) {
      let changed = false;
      const inputs = g.inputs.map((input) => {
        const patch = predicate(input);
        if (!patch) return input;
        changed = true;
        return { ...input, ...patch };
      });
      if (changed) void replaceGoal({ ...g, inputs });
    }
  };

  const unlinkHabits = (predicate: (habit: Habit) => boolean) => {
    const affected = get().habits.filter(predicate);
    if (affected.length === 0) return;
    set({ habits: get().habits.map((h) => (predicate(h) ? { ...h, link: null } : h)) });
    for (const h of affected) void persist(repo().habits.update(h.id, { link: null }));
  };

  const unlinkSolutions = (habitId: string) => {
    for (const b of get().bosses) {
      const entry = b.entries.find((e) => e.habitId === habitId);
      if (!entry) continue;
      const next = { ...entry, habitId: null };
      replaceBoss({ ...b, entries: b.entries.map((e) => (e.id === entry.id ? next : e)) });
      void persist(repo().bosses.upsertEntry(b.id, next));
    }
  };

  return {
    ready: false,
    saveError: null,
    loadError: null,
    habits: [],
    visions: {} as AppData["visions"],
    goals: [],
    bosses: [],
    settings: { userName: "Santiago", soundEnabled: true },

    hydrate() {
      // React StrictMode runs effects twice in dev: share one load instead of racing two.
      if (!hydrating) {
        set({ loadError: null });
        hydrating = repo()
          .load()
          .then((data) => {
            setSoundEnabled(data.settings.soundEnabled);
            set({ ...data, ready: true });
          })
          .catch((error) => {
            console.error(error);
            set({ ready: false, loadError: "No se pudieron cargar tus datos. Revisa tu conexión e inténtalo de nuevo." });
          })
          .finally(() => {
            hydrating = null;
          });
      }
      return hydrating;
    },

    async refresh() {
      if (!get().ready || pending > 0) return;
      const seen = writes;
      try {
        const data = await repo().load();
        // Something was edited while we were reading: that snapshot is already out of date.
        if (writes !== seen || pending > 0) return;
        setSoundEnabled(data.settings.soundEnabled);
        set({ ...data });
      } catch (error) {
        console.error(error);
      }
    },

    reset() {
      set({
        ready: false,
        saveError: null,
        loadError: null,
        habits: [],
        visions: {} as AppData["visions"],
        goals: [],
        bosses: [],
        settings: { userName: "Santiago", soundEnabled: true },
      });
    },

    dismissSaveError: () => set({ saveError: null }),

    // ───────────────────────── Habits ─────────────────────────

    addHabit(name, options = {}) {
      const habits = get().habits;
      const habit: Habit = {
        id: newId(),
        name: name.trim(),
        reward: options.reward?.trim() || null,
        priority: false,
        position: habits.reduce((max, h) => Math.max(max, h.position), -1) + 1,
        completions: [],
        link: options.link ?? null,
        createdAt: new Date().toISOString(),
      };
      set({ habits: [...habits, habit] });
      void persist(repo().habits.create(habit));
      return habit;
    },

    updateHabit(id, patch) {
      set({ habits: get().habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
      return persist(repo().habits.update(id, patch));
    },

    removeHabit(id) {
      set({ habits: get().habits.filter((h) => h.id !== id) });
      void persist(repo().habits.remove(id));
      unlinkInputs((input) => (input.habitId === id ? { habitId: null } : null));
      unlinkSolutions(id);
    },

    setCompletion(id, day, done) {
      set({
        habits: get().habits.map((h) => {
          if (h.id !== id) return h;
          const rest = h.completions.filter((c) => c !== day);
          return { ...h, completions: done ? [...rest, day] : rest };
        }),
      });
      void persist(repo().habits.setCompletion(id, day, done));
    },

    reorderHabits(orderedIds) {
      const position = new Map(orderedIds.map((id, i) => [id, i]));
      set({
        habits: get().habits.map((h) => ({ ...h, position: position.get(h.id) ?? h.position })),
      });
      void persist(repo().habits.reorder(orderedIds));
    },

    // ───────────────────── Portal / Antiportal ─────────────────────

    updateVision(kind, patch) {
      const visions = get().visions;
      set({ visions: { ...visions, [kind]: { ...visions[kind], ...patch } } });
      return persist(repo().visions.updateBoard(kind, patch));
    },

    updateSlide(kind, slideId, patch) {
      const visions = get().visions;
      const slides = visions[kind].slides;
      const index = slides.findIndex((s) => s.id === slideId);
      if (index < 0) return Promise.resolve(false);
      const slide = { ...slides[index], ...patch };
      set({
        visions: {
          ...visions,
          [kind]: { ...visions[kind], slides: slides.map((s) => (s.id === slideId ? slide : s)) },
        },
      });
      return persist(repo().visions.upsertSlide(kind, slide, index));
    },

    addSlide(kind) {
      const visions = get().visions;
      const id = newId();
      const slide = { ...emptySlide(id, "NUEVA SLIDE"), id };
      const slides = [...visions[kind].slides, slide];
      set({ visions: { ...visions, [kind]: { ...visions[kind], slides } } });
      void persist(repo().visions.upsertSlide(kind, slide, slides.length - 1));
      return slide;
    },

    removeSlide(kind, slideId) {
      const visions = get().visions;
      const slides = visions[kind].slides.filter((s) => s.id !== slideId);
      set({ visions: { ...visions, [kind]: { ...visions[kind], slides } } });
      void persist(repo().visions.removeSlide(kind, slideId));
    },

    // ───────────────────────── Ley Causal ─────────────────────────

    addGoal() {
      const created: CausalGoal = {
        id: newId(),
        effect: "",
        targetDate: null,
        initialState: "",
        isMain: get().goals.length === 0,
        inputs: [],
        createdAt: new Date().toISOString(),
      };
      set({ goals: [...get().goals, created] });
      void persist(repo().goals.saveGoal(created));
      return created;
    },

    updateGoal(id, patch) {
      const current = goal(id);
      return current ? replaceGoal({ ...current, ...patch }) : Promise.resolve(false);
    },

    toggleMainGoal(id) {
      const makeMain = !goal(id)?.isMain;
      for (const g of get().goals) {
        const isMain = g.id === id ? makeMain : false;
        if (g.isMain !== isMain) void replaceGoal({ ...g, isMain });
      }
    },

    removeGoal(id) {
      set({ goals: get().goals.filter((g) => g.id !== id) });
      void persist(repo().goals.removeGoal(id));
      unlinkHabits((h) => h.link?.kind === "input" && h.link.goalId === id);
      for (const b of get().bosses) {
        if (b.sourceInput?.goalId === id) void get().updateBoss(b.id, { sourceInput: null });
      }
    },

    addInput(goalId, text) {
      const current = goal(goalId);
      if (!current || !text.trim()) return;
      const input: CausalInput = {
        id: newId(),
        text: text.trim(),
        status: "pending",
        habitId: null,
        bossId: null,
      };
      void replaceGoal({ ...current, inputs: [...current.inputs, input] });
    },

    updateInput(goalId, inputId, patch) {
      const current = goal(goalId);
      if (!current) return Promise.resolve(false);
      return replaceGoal({
        ...current,
        inputs: current.inputs.map((i) => (i.id === inputId ? { ...i, ...patch } : i)),
      });
    },

    removeInput(goalId, inputId) {
      const current = goal(goalId);
      if (!current) return;
      void replaceGoal({ ...current, inputs: current.inputs.filter((i) => i.id !== inputId) });
      unlinkHabits((h) => h.link?.kind === "input" && h.link.inputId === inputId);
      for (const b of get().bosses) {
        if (b.sourceInput?.inputId === inputId) void get().updateBoss(b.id, { sourceInput: null });
      }
    },

    convertInputToHabit(goalId, inputId) {
      const current = goal(goalId);
      const input = current?.inputs.find((i) => i.id === inputId);
      if (!current || !input) return null;
      const habit = get().addHabit(input.text, { link: { kind: "input", goalId, inputId } });
      void replaceGoal({
        ...current,
        inputs: current.inputs.map((i) => (i.id === inputId ? { ...i, habitId: habit.id } : i)),
      });
      return habit;
    },

    createBossFromInput(goalId, inputId, name, spriteId) {
      const current = goal(goalId);
      if (!current?.inputs.some((i) => i.id === inputId)) return null;
      const created = get().addBoss(name, { sourceInput: { goalId, inputId }, spriteId });
      void replaceGoal({
        ...current,
        inputs: current.inputs.map((i) => (i.id === inputId ? { ...i, bossId: created.id } : i)),
      });
      return created;
    },

    // ───────────────────────── Bosses ─────────────────────────

    addBoss(name, { sourceInput = null, spriteId } = {}) {
      const bosses = get().bosses;
      const number = bosses.reduce((max, b) => Math.max(max, b.number), 0) + 1;
      const created: Boss = {
        id: newId(),
        number,
        name: name.trim() || `Jefe ${number}`,
        spriteId: spriteId ?? nextSpriteId(number),
        startedAt: todayKey(),
        defeatedAt: null,
        sourceInput,
        entries: [],
        createdAt: new Date().toISOString(),
      };
      set({ bosses: [...bosses, created] });
      void persist(repo().bosses.create(created));
      return created;
    },

    updateBoss(id, patch) {
      const current = boss(id);
      if (!current) return Promise.resolve(false);
      replaceBoss({ ...current, ...patch });
      return persist(repo().bosses.update(id, patch));
    },

    removeBoss(id) {
      set({ bosses: get().bosses.filter((b) => b.id !== id) });
      void persist(repo().bosses.remove(id));
      unlinkInputs((input) => (input.bossId === id ? { bossId: null } : null));
      unlinkHabits((h) => h.link?.kind === "solution" && h.link.bossId === id);
    },

    addEntry(bossId, { type, text, size, target }) {
      const entry: BossEntry = {
        id: newId(),
        type,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      if (type === "solution") {
        entry.size = size ?? "small";
        entry.target = target && target > 1 ? Math.round(target) : null;
        entry.progress = 0;
        entry.completedAt = null;
        entry.habitId = null;
      }
      const current = boss(bossId);
      if (current) {
        replaceBoss({ ...current, entries: [...current.entries, entry] });
        void persist(repo().bosses.upsertEntry(bossId, entry));
      }
      return entry;
    },

    updateEntry(bossId, entryId, patch) {
      const current = boss(bossId);
      const entry = current?.entries.find((e) => e.id === entryId);
      if (!current || !entry) return Promise.resolve(false);
      const next = { ...entry, ...patch };
      replaceBoss({ ...current, entries: current.entries.map((e) => (e.id === entryId ? next : e)) });
      return persist(repo().bosses.upsertEntry(bossId, next));
    },

    removeEntry(bossId, entryId) {
      const current = boss(bossId);
      if (!current) return;
      replaceBoss({ ...current, entries: current.entries.filter((e) => e.id !== entryId) });
      void persist(repo().bosses.removeEntry(bossId, entryId));
      unlinkHabits((h) => h.link?.kind === "solution" && h.link.entryId === entryId);
    },

    convertSolutionToHabit(bossId, entryId) {
      const entry = boss(bossId)?.entries.find((e) => e.id === entryId);
      if (!entry || entry.type !== "solution") return null;
      const habit = get().addHabit(entry.text, { link: { kind: "solution", bossId, entryId } });
      void get().updateEntry(bossId, entryId, { habitId: habit.id });
      return habit;
    },

    // ───────────────────────── Settings & data ─────────────────────────

    updateSettings(patch) {
      const settings = { ...get().settings, ...patch };
      setSoundEnabled(settings.soundEnabled);
      set({ settings });
      return persist(repo().settings.save(settings));
    },

    exportData() {
      const { habits, visions, goals, bosses, settings } = get();
      return structuredClone({ version: 1, habits, visions, goals, bosses, settings });
    },

    async importData(raw) {
      writes++;
      pending++;
      try {
        await repo().replaceAll(normalizeData(raw));
      } finally {
        pending--;
      }
      // Read it back: the backend may have fixed up ids, and this keeps the store identical to what was saved.
      const data = await repo().load();
      setSoundEnabled(data.settings.soundEnabled);
      set({ ...data, ready: true, saveError: null });
    },
  };
});

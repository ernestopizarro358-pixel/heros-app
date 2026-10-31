import type {
  AppData,
  Boss,
  BossEntry,
  CausalGoal,
  DayKey,
  Habit,
  Settings,
  VisionBoard,
  VisionKind,
  VisionSlide,
} from "./types";

/**
 * Persistence contracts. Components never talk to storage directly: they go
 * through the store (`lib/store`), which calls these repositories.
 *
 * Every method is async so a remote backend (Supabase) can implement the same
 * interface without touching the UI. Shapes map 1:1 to `supabase/schema.sql`.
 */

export type HabitPatch = Partial<Pick<Habit, "name" | "reward" | "priority" | "link">>;

export interface HabitRepository {
  create(habit: Habit): Promise<void>;
  update(id: string, patch: HabitPatch): Promise<void>;
  remove(id: string): Promise<void>;
  /** Persists `position` for every habit, in the given order. */
  reorder(orderedIds: string[]): Promise<void>;
  setCompletion(habitId: string, day: DayKey, done: boolean): Promise<void>;
}

export type VisionBoardPatch = Partial<Pick<VisionBoard, "beliefs" | "text" | "inspiration">>;

export interface VisionRepository {
  updateBoard(kind: VisionKind, patch: VisionBoardPatch): Promise<void>;
  /** Insert or update a slide at the given position. */
  upsertSlide(kind: VisionKind, slide: VisionSlide, position: number): Promise<void>;
  removeSlide(kind: VisionKind, slideId: string): Promise<void>;
}

export interface CausalRepository {
  /** Insert or update a goal together with its inputs (missing inputs are deleted). */
  saveGoal(goal: CausalGoal): Promise<void>;
  removeGoal(goalId: string): Promise<void>;
}

export type BossPatch = Partial<Pick<Boss, "name" | "spriteId" | "defeatedAt" | "sourceInput">>;

export interface BossRepository {
  create(boss: Boss): Promise<void>;
  update(id: string, patch: BossPatch): Promise<void>;
  remove(id: string): Promise<void>;
  upsertEntry(bossId: string, entry: BossEntry): Promise<void>;
  removeEntry(bossId: string, entryId: string): Promise<void>;
}

export interface SettingsRepository {
  save(settings: Settings): Promise<void>;
}

export interface DataRepository {
  /** Loads everything the app needs at start-up. */
  load(): Promise<AppData>;
  /** Replaces all data (JSON import). */
  replaceAll(data: AppData): Promise<void>;
  habits: HabitRepository;
  visions: VisionRepository;
  goals: CausalRepository;
  bosses: BossRepository;
  settings: SettingsRepository;
}

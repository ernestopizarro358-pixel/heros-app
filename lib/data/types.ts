/**
 * Domain model for Heroes App.
 * Dates without time ("días") are ISO strings `YYYY-MM-DD` in America/La_Paz.
 * Timestamps are full ISO strings (UTC).
 */

export type DayKey = string;

// ───────────────────────── Habits ─────────────────────────

export type HabitLink =
  | { kind: "input"; goalId: string; inputId: string }
  | { kind: "solution"; bossId: string; entryId: string };

export interface Habit {
  id: string;
  name: string;
  reward: string | null;
  priority: boolean;
  position: number;
  /** Days marked as done. Stored in `habit_completions` on Supabase. */
  completions: DayKey[];
  link: HabitLink | null;
  createdAt: string;
}

// ───────────────────── Portal / Antiportal ─────────────────────

export type VisionKind = "portal" | "antiportal";

export interface VisionSlide {
  id: string;
  /** Stable key used to pair slides between Portal and Antiportal (yo, ella…). */
  key: string;
  title: string;
  /** Always 4 slots (2×2). `null` = empty slot. */
  images: (string | null)[];
  text: string;
}

export interface VisionBoard {
  kind: VisionKind;
  /** Inspiration board slots (8 by default, can grow). */
  inspiration: (string | null)[];
  beliefs: string;
  text: string;
  slides: VisionSlide[];
}

// ───────────────────────── Ley Causal ─────────────────────────

export type InputStatus = "pending" | "in_progress" | "done";

export interface CausalInput {
  id: string;
  text: string;
  status: InputStatus;
  habitId: string | null;
  bossId: string | null;
}

export interface CausalGoal {
  id: string;
  effect: string;
  targetDate: DayKey | null;
  initialState: string;
  isMain: boolean;
  inputs: CausalInput[];
  createdAt: string;
}

// ───────────────────────── Bosses ─────────────────────────

export type EntryType = "belief" | "learning" | "solution";
export type SolutionSize = "small" | "medium" | "large";

export interface BossEntry {
  id: string;
  type: EntryType;
  text: string;
  createdAt: string;
  /** Solution-only fields. */
  size?: SolutionSize;
  /** Optional counter (e.g. 30 días). `null` = single shot. */
  target?: number | null;
  progress?: number;
  completedAt?: string | null;
  habitId?: string | null;
}

export interface Boss {
  id: string;
  /** Sequential number shown as "Jefe N". */
  number: number;
  name: string;
  spriteId: string;
  startedAt: DayKey;
  defeatedAt: string | null;
  sourceInput: { goalId: string; inputId: string } | null;
  entries: BossEntry[];
  createdAt: string;
}

// ───────────────────────── Settings ─────────────────────────

export interface Settings {
  userName: string;
  soundEnabled: boolean;
}

// ───────────────────────── Snapshot ─────────────────────────

export interface AppData {
  version: number;
  habits: Habit[];
  visions: Record<VisionKind, VisionBoard>;
  goals: CausalGoal[];
  bosses: Boss[];
  settings: Settings;
}

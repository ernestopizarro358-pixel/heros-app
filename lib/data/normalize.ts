import { newId } from "../id";
import { DATA_VERSION, SLIDE_IMAGE_SLOTS, defaultBoard, defaultData } from "./defaults";
import type {
  AppData,
  Boss,
  BossEntry,
  CausalGoal,
  CausalInput,
  Habit,
  VisionBoard,
  VisionKind,
  VisionSlide,
} from "./types";

/**
 * Turns untrusted JSON (localStorage or an imported backup) into a valid
 * AppData, filling anything missing with defaults.
 */

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const day = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

function normalizeHabit(raw: Raw, index: number): Habit {
  const link = isObj(raw.link) ? raw.link : null;
  return {
    id: str(raw.id) || newId(),
    name: str(raw.name, "Hábito"),
    reward: strOrNull(raw.reward),
    priority: raw.priority === true,
    position: num(raw.position, index),
    completions: [...new Set(arr(raw.completions).map(day).filter((d): d is string => !!d))],
    link:
      link?.kind === "input"
        ? { kind: "input", goalId: str(link.goalId), inputId: str(link.inputId) }
        : link?.kind === "solution"
          ? { kind: "solution", bossId: str(link.bossId), entryId: str(link.entryId) }
          : null,
    createdAt: str(raw.createdAt, new Date().toISOString()),
  };
}

function normalizeSlide(raw: Raw): VisionSlide {
  const images = arr(raw.images).map(strOrNull).slice(0, SLIDE_IMAGE_SLOTS);
  while (images.length < SLIDE_IMAGE_SLOTS) images.push(null);
  const id = str(raw.id) || newId();
  return { id, key: str(raw.key) || id, title: str(raw.title, "SLIDE"), images, text: str(raw.text) };
}

function normalizeBoard(raw: unknown, kind: VisionKind): VisionBoard {
  if (!isObj(raw)) return defaultBoard(kind);
  const fallback = defaultBoard(kind);
  const inspiration = Array.isArray(raw.inspiration)
    ? raw.inspiration.map(strOrNull)
    : fallback.inspiration;
  return {
    kind,
    inspiration: inspiration.length > 0 ? inspiration : fallback.inspiration,
    beliefs: str(raw.beliefs),
    text: str(raw.text),
    slides: Array.isArray(raw.slides)
      ? raw.slides.filter(isObj).map(normalizeSlide)
      : fallback.slides,
  };
}

function normalizeInput(raw: Raw): CausalInput {
  const status = raw.status === "in_progress" || raw.status === "done" ? raw.status : "pending";
  return {
    id: str(raw.id) || newId(),
    text: str(raw.text),
    status,
    habitId: strOrNull(raw.habitId),
    bossId: strOrNull(raw.bossId),
  };
}

function normalizeGoal(raw: Raw): CausalGoal {
  return {
    id: str(raw.id) || newId(),
    effect: str(raw.effect),
    targetDate: day(raw.targetDate),
    initialState: str(raw.initialState),
    isMain: raw.isMain === true,
    inputs: arr(raw.inputs).filter(isObj).map(normalizeInput),
    createdAt: str(raw.createdAt, new Date().toISOString()),
  };
}

function normalizeEntry(raw: Raw): BossEntry {
  const type = raw.type === "learning" || raw.type === "solution" ? raw.type : "belief";
  const entry: BossEntry = {
    id: str(raw.id) || newId(),
    type,
    text: str(raw.text),
    createdAt: str(raw.createdAt, new Date().toISOString()),
  };
  if (type === "solution") {
    entry.size = raw.size === "medium" || raw.size === "large" ? raw.size : "small";
    const target = num(raw.target, 0);
    entry.target = target > 1 ? Math.round(target) : null;
    entry.progress = Math.max(0, Math.round(num(raw.progress, 0)));
    entry.completedAt = strOrNull(raw.completedAt);
    entry.habitId = strOrNull(raw.habitId);
  }
  return entry;
}

function normalizeBoss(raw: Raw, index: number): Boss {
  const source = isObj(raw.sourceInput) ? raw.sourceInput : null;
  return {
    id: str(raw.id) || newId(),
    number: num(raw.number, index + 1),
    name: str(raw.name, "Jefe"),
    spriteId: str(raw.spriteId, "knight"),
    startedAt: day(raw.startedAt) ?? new Date().toISOString().slice(0, 10),
    defeatedAt: strOrNull(raw.defeatedAt),
    sourceInput: source ? { goalId: str(source.goalId), inputId: str(source.inputId) } : null,
    entries: arr(raw.entries).filter(isObj).map(normalizeEntry),
    createdAt: str(raw.createdAt, new Date().toISOString()),
  };
}

export function normalizeData(raw: unknown): AppData {
  if (!isObj(raw)) throw new Error("El archivo no contiene datos válidos de Heroes App.");
  const fallback = defaultData();
  const visions = isObj(raw.visions) ? raw.visions : {};
  const settings = isObj(raw.settings) ? raw.settings : {};
  return {
    version: DATA_VERSION,
    habits: arr(raw.habits).filter(isObj).map(normalizeHabit),
    visions: {
      portal: normalizeBoard(visions.portal, "portal"),
      antiportal: normalizeBoard(visions.antiportal, "antiportal"),
    },
    goals: arr(raw.goals).filter(isObj).map(normalizeGoal),
    bosses: arr(raw.bosses).filter(isObj).map(normalizeBoss),
    settings: {
      userName: str(settings.userName, fallback.settings.userName) || fallback.settings.userName,
      soundEnabled: settings.soundEnabled !== false,
    },
  };
}

/** Light check used before importing a backup. */
export function looksLikeBackup(raw: unknown): boolean {
  return isObj(raw) && ("habits" in raw || "visions" in raw || "bosses" in raw || "goals" in raw);
}

import { newId } from "../id";
import type { AppData, VisionBoard, VisionKind, VisionSlide } from "./types";

export const DATA_VERSION = 1;
export const INSPIRATION_SLOTS = 8;
export const SLIDE_IMAGE_SLOTS = 4;

export const DEFAULT_SLIDES: { key: string; title: string }[] = [
  { key: "yo", title: "YO" },
  { key: "ella", title: "ELLA" },
  { key: "dinero", title: "DINERO / EMPRESA" },
  { key: "panas", title: "PANAS" },
  { key: "hobbies", title: "HOBBIES" },
  { key: "templo", title: "TEMPLO" },
];

export function emptySlide(key: string, title: string): VisionSlide {
  return {
    id: newId(),
    key,
    title,
    images: Array.from({ length: SLIDE_IMAGE_SLOTS }, () => null),
    text: "",
  };
}

export function defaultBoard(kind: VisionKind): VisionBoard {
  return {
    kind,
    inspiration: Array.from({ length: INSPIRATION_SLOTS }, () => null),
    beliefs: "",
    text: "",
    slides: DEFAULT_SLIDES.map(({ key, title }) => emptySlide(key, title)),
  };
}

export function defaultData(): AppData {
  return {
    version: DATA_VERSION,
    habits: [],
    visions: { portal: defaultBoard("portal"), antiportal: defaultBoard("antiportal") },
    goals: [],
    bosses: [],
    settings: { userName: "Santiago", soundEnabled: true },
  };
}

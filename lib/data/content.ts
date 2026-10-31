import type { AppData } from "./types";

/** True when the snapshot holds anything the user wrote (i.e. it is not a fresh account). */
export function hasUserContent(data: AppData): boolean {
  if (data.habits.length > 0 || data.goals.length > 0 || data.bosses.length > 0) return true;
  if (data.settings.userName !== "Santiago") return true;
  return Object.values(data.visions).some(
    (board) =>
      board.beliefs.trim() !== "" ||
      board.text.trim() !== "" ||
      board.inspiration.some(Boolean) ||
      board.slides.some((slide) => slide.text.trim() !== "" || slide.images.some(Boolean)),
  );
}

/** Short Spanish summary used when offering to move local data to the cloud. */
export function describeContent(data: AppData): string {
  const parts = [
    [data.habits.length, "hábito", "hábitos"],
    [data.goals.length, "objetivo causal", "objetivos causales"],
    [data.bosses.length, "jefe", "jefes"],
  ] as const;
  const found = parts.filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  return found.length > 0 ? found.join(", ") + " y tus textos del Portal/Antiportal" : "tus textos del Portal/Antiportal";
}

import confetti from "canvas-confetti";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function originOf(element?: Element | null) {
  if (!element) return { x: 0.5, y: 0.5 };
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  };
}

export const MINT_CONFETTI = ["#5eead4", "#6ee7b7", "#a7f3d0", "#ffffff", "#fcd34d"];
export const GOLD_CONFETTI = ["#fbbf24", "#f59e0b", "#fde68a", "#ffffff", "#fb923c"];
export const RED_CONFETTI = ["#ef4444", "#f87171", "#fbbf24", "#ffffff", "#fb7185"];

/** Big burst centred on an element. */
export function burstFrom(element: Element | null | undefined, colors = MINT_CONFETTI) {
  if (reducedMotion()) return;
  const origin = originOf(element);
  const base = { origin, colors, disableForReducedMotion: true, zIndex: 1000 };
  confetti({ ...base, particleCount: 90, spread: 75, startVelocity: 42, scalar: 1 });
  confetti({ ...base, particleCount: 50, spread: 120, startVelocity: 30, scalar: 0.8, decay: 0.92 });
}

/** Two side cannons — used for big moments (reward revealed, boss defeated). */
export function celebrate(colors = MINT_CONFETTI) {
  if (reducedMotion()) return;
  const end = Date.now() + 900;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors, zIndex: 1000 });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors, zIndex: 1000 });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

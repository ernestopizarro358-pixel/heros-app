"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GOLD_CONFETTI, MINT_CONFETTI, celebrate } from "@/lib/confetti";
import { sfx } from "@/lib/sound";

export interface RewardReveal {
  habitName: string;
  reward: string;
  priority: boolean;
}

type Phase = "shaking" | "open";

/** Gift box that shakes, pops its lid and reveals the habit's reward. */
export function RewardModal({ reveal, onClose }: { reveal: RewardReveal | null; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("shaking");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!reveal) return;
    setPhase("shaking");
    sfx.giftShake();
    const timer = setTimeout(() => setPhase("open"), 1350);
    return () => clearTimeout(timer);
  }, [reveal]);

  useEffect(() => {
    if (phase !== "open" || !reveal) return;
    sfx.giftOpen();
    celebrate(reveal.priority ? GOLD_CONFETTI : MINT_CONFETTI);
  }, [phase, reveal]);

  useEffect(() => {
    if (!reveal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reveal, onClose]);

  if (!mounted) return null;

  const gold = reveal?.priority;
  const boxBody = gold
    ? "bg-[linear-gradient(160deg,#fbbf24_0%,#d97706_55%,#92400e_100%)]"
    : "bg-[linear-gradient(160deg,#5eead4_0%,#14b8a6_50%,#0f5f58_100%)]";
  const ribbon = gold ? "bg-[#fff7e0]" : "bg-[#fbbf24]";

  return createPortal(
    <AnimatePresence>
      {reveal && (
        <motion.div
          className="fixed inset-0 z-[950] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Recompensa desbloqueada"
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={phase === "open" ? onClose : undefined} />

          <div className="relative flex w-full max-w-sm flex-col items-center text-center">
            {/* Light rays */}
            <motion.div
              className="pointer-events-none absolute top-[60px] h-[420px] w-[420px] -translate-y-1/2 rounded-full"
              style={{
                background: `repeating-conic-gradient(from 0deg, ${gold ? "rgb(251 191 36 / 0.22)" : "rgb(94 234 212 / 0.2)"} 0deg 10deg, transparent 10deg 30deg)`,
                maskImage: "radial-gradient(circle, black 0%, transparent 65%)",
                WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 65%)",
              }}
              initial={{ opacity: 0, scale: 0.4, rotate: 0 }}
              animate={phase === "open" ? { opacity: 1, scale: 1, rotate: 90 } : { opacity: 0.25, scale: 0.55, rotate: 20 }}
              transition={{ duration: phase === "open" ? 6 : 1.3, ease: "easeOut" }}
            />

            {/* Gift box */}
            <button
              type="button"
              onClick={() => setPhase("open")}
              disabled={phase === "open"}
              aria-label="Abrir regalo"
              className="relative mt-4 h-[150px] w-[150px]"
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={
                  phase === "shaking"
                    ? {
                        scale: [0.3, 1.05, 1, 1.04, 1, 1.06],
                        opacity: 1,
                        rotate: [0, 0, -9, 9, -12, 12, -7, 7, 0],
                      }
                    : { scale: [1.06, 0.9, 1], opacity: 1, rotate: 0, y: [0, 6, 0] }
                }
                transition={phase === "shaking" ? { duration: 1.3, ease: "easeInOut" } : { duration: 0.4 }}
              >
                {/* glow */}
                <div
                  className="absolute inset-x-2 bottom-0 h-[105px] rounded-2xl blur-2xl"
                  style={{ background: gold ? "rgb(251 191 36 / 0.45)" : "rgb(94 234 212 / 0.4)" }}
                />
                {/* body */}
                <div className={`absolute inset-x-3 bottom-0 h-[100px] overflow-hidden rounded-b-xl ${boxBody} shadow-[inset_0_-12px_24px_rgb(0_0_0/0.25)]`}>
                  <div className={`absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 ${ribbon} shadow-[0_0_10px_rgb(0_0_0/0.25)]`} />
                </div>
                {/* lid */}
                <motion.div
                  className="absolute inset-x-0 top-[22px] h-[32px]"
                  animate={phase === "open" ? { y: -140, x: 30, rotate: 28, opacity: 0 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
                  transition={phase === "open" ? { type: "spring", stiffness: 140, damping: 12, opacity: { delay: 0.45, duration: 0.3 } } : {}}
                >
                  <div className={`absolute inset-0 rounded-lg ${boxBody} shadow-[0_6px_14px_rgb(0_0_0/0.35)]`}>
                    <div className={`absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 ${ribbon}`} />
                  </div>
                  {/* bow */}
                  <div className={`absolute -top-[22px] left-1/2 h-[26px] w-[30px] -translate-x-[95%] rotate-[-20deg] rounded-[50%_50%_10%_50%] border-[6px] ${gold ? "border-[#fff7e0]" : "border-[#fbbf24]"}`} />
                  <div className={`absolute -top-[22px] left-1/2 h-[26px] w-[30px] -translate-x-[5%] rotate-[20deg] rounded-[50%_50%_50%_10%] border-[6px] ${gold ? "border-[#fff7e0]" : "border-[#fbbf24]"}`} />
                </motion.div>
              </motion.div>

              {/* burst flash */}
              {phase === "open" && (
                <motion.div
                  className="pointer-events-none absolute inset-0 m-auto h-24 w-24 rounded-full bg-white"
                  initial={{ scale: 0.2, opacity: 0.95 }}
                  animate={{ scale: 3.2, opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              )}
            </button>

            <div className="relative mt-6 min-h-[170px] w-full">
              <AnimatePresence mode="wait">
                {phase === "shaking" ? (
                  <motion.p
                    key="hint"
                    className="label !text-soft"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    Tienes un regalo…
                  </motion.p>
                ) : (
                  <motion.div
                    key="reward"
                    initial={{ opacity: 0, y: 30, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
                  >
                    <p className={`label ${gold ? "!text-gold" : "!text-mint"}`}>Recompensa desbloqueada</p>
                    <h2 className="mt-3 text-2xl font-extrabold">¡Perfecto! Ahora tienes:</h2>
                    <p
                      className={`mt-3 text-xl leading-snug font-semibold break-words ${gold ? "text-gold-soft" : "text-mint"}`}
                      style={{ textShadow: gold ? "0 0 24px rgb(251 191 36 / 0.45)" : "0 0 24px rgb(94 234 212 / 0.4)" }}
                    >
                      {reveal.reward} 🎉
                    </p>
                    <p className="mt-3 text-xs text-muted">Por cumplir: {reveal.habitName}</p>
                    <button autoFocus className="btn btn-light mt-6 px-6" onClick={onClose}>
                      ¡A disfrutarlo!
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

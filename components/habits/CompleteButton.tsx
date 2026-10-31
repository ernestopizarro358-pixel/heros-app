"use client";

import { motion, useAnimationControls } from "framer-motion";
import { forwardRef, useEffect, useRef } from "react";
import { Sparkles } from "./Sparkles";

const MINT_SPARKS = ["#ffffff", "#5eead4", "#a7f3d0", "#6ee7b7"];
const GOLD_SPARKS = ["#ffffff", "#fbbf24", "#fde68a", "#fb923c"];

interface Props {
  done: boolean;
  priority: boolean;
  /** Increments every time the habit is completed → replays the celebration. */
  celebrateKey: number;
  onToggle: () => void;
  label: string;
}

/** The big "TOCA PARA COMPLETAR" circle. */
export const CompleteButton = forwardRef<HTMLButtonElement, Props>(function CompleteButton(
  { done, priority, celebrateKey, onToggle, label },
  ref,
) {
  const controls = useAnimationControls();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (celebrateKey > 0) {
      void controls.start({
        scale: [1, 0.84, 1.14, 0.97, 1],
        transition: { duration: 0.6, times: [0, 0.18, 0.5, 0.78, 1], ease: "easeOut" },
      });
    }
  }, [celebrateKey, controls]);

  const surface = done
    ? priority
      ? "bg-[radial-gradient(circle_at_34%_28%,#fff1d0_0%,#f8cd86_32%,#eda552_68%,#c9731f_100%)] border-[#ffd27a]/70 animate-glow-gold"
      : "bg-[radial-gradient(circle_at_34%_28%,#e6fff8_0%,#8ff5dd_30%,#43d8bd_66%,#0f9f8c_100%)] border-[#b5fff0]/60 animate-glow-mint"
    : priority
      ? "bg-[radial-gradient(circle_at_34%_28%,#2c2416_0%,#15120c_55%,#0b0a08_100%)] border-gold/45 shadow-[0_0_30px_rgb(251_191_36/0.12),inset_0_2px_12px_rgb(251_191_36/0.08)]"
      : "bg-[radial-gradient(circle_at_34%_28%,#2b2b2b_0%,#151515_55%,#0b0b0b_100%)] border-white/[0.07] shadow-[0_10px_40px_rgb(0_0_0/0.6),inset_0_2px_10px_rgb(255_255_255/0.04)]";

  const checkColor = done ? (priority ? "#4a2405" : "#053b35") : priority ? "#f5c27a" : "#a3a3a3";

  return (
    <div className="relative flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
      {/* Shockwave rings */}
      {celebrateKey > 0 && done && (
        <div key={`rings-${celebrateKey}`} className="pointer-events-none absolute inset-0" aria-hidden>
          {[0, 0.12].map((delay) => (
            <motion.span
              key={delay}
              className={`absolute inset-0 rounded-full border-2 ${priority ? "border-gold" : "border-mint"}`}
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.9, opacity: 0 }}
              transition={{ duration: 0.8, delay, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      <motion.button
        ref={ref}
        type="button"
        onClick={onToggle}
        animate={controls}
        whileHover={{ scale: 1.035 }}
        whileTap={{ scale: 0.93 }}
        aria-pressed={done}
        aria-label={label}
        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border transition-[background,border-color] duration-300 ${surface}`}
      >
        {/* Glossy highlight */}
        <span className="pointer-events-none absolute top-[9%] left-[20%] h-[30%] w-[45%] rounded-full bg-white/10 blur-md" />

        {/* Flash */}
        {celebrateKey > 0 && done && (
          <motion.span
            key={`flash-${celebrateKey}`}
            className="pointer-events-none absolute inset-0 rounded-full bg-white"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}

        <svg viewBox="0 0 48 48" className="relative h-[42%] w-[42%]" aria-hidden>
          <motion.path
            key={done ? `done-${celebrateKey}` : "idle"}
            d="M11 25.5 20 34 37 15"
            fill="none"
            stroke={checkColor}
            strokeWidth={done ? 4.2 : 3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: done && celebrateKey > 0 ? 0 : 1 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          />
        </svg>
      </motion.button>

      {celebrateKey > 0 && done && (
        <Sparkles key={`sparks-${celebrateKey}`} colors={priority ? GOLD_SPARKS : MINT_SPARKS} />
      )}
    </div>
  );
});

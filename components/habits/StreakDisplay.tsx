"use client";

import { animate, motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Number that counts up/down to its new value and pops when it grows. */
function AnimatedCount({ value, className }: { value: number; className: string }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const controls = useAnimationControls();

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;
    const counter = animate(from, value, {
      duration: Math.min(0.9, 0.25 + Math.abs(value - from) * 0.06),
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    if (value > from) {
      void controls.start({
        scale: [1, 1.45, 0.95, 1],
        y: [0, -6, 0, 0],
        transition: { duration: 0.55, ease: "easeOut" },
      });
    }
    return () => counter.stop();
  }, [value, controls]);

  return (
    <motion.span animate={controls} className={`inline-block origin-left tabular-nums ${className}`}>
      {display}
    </motion.span>
  );
}

export function StreakDisplay({
  current,
  longest,
  priority,
  doneToday,
}: {
  current: number;
  longest: number;
  priority: boolean;
  doneToday: boolean;
}) {
  const numberColor = priority
    ? "text-gold-soft [text-shadow:0_0_24px_rgb(251_191_36/0.45)]"
    : doneToday
      ? "text-ink [text-shadow:0_0_22px_rgb(94_234_212/0.45)]"
      : "text-ink";

  return (
    <div className="min-w-[5.5rem]">
      <AnimatedCount value={current} className={`text-5xl leading-none font-extrabold sm:text-6xl ${numberColor}`} />
      <p className={`label mt-2 ${priority ? "!text-gold/80" : "!text-soft/70"}`}>Racha de días</p>
      <p className="mt-1 font-mono text-[11px] text-muted">
        Más largo: {longest} {longest === 1 ? "día" : "días"}
      </p>
    </div>
  );
}

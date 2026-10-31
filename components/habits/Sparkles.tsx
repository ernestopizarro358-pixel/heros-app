"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  angle: number;
  distance: number;
  size: number;
  delay: number;
  color: string;
  spin: number;
}

function makeParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
    distance: 70 + Math.random() * 55,
    size: 7 + Math.random() * 9,
    delay: Math.random() * 0.08,
    color: colors[i % colors.length],
    spin: (Math.random() - 0.5) * 300,
  }));
}

/** Four-point stars bursting from the centre. Re-mount (change `key`) to replay. */
export function Sparkles({ colors, count = 14 }: { colors: string[]; count?: number }) {
  const particles = useMemo(() => makeParticles(count, colors), [count, colors]);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {particles.map((p, i) => (
        <motion.svg
          key={i}
          width={p.size}
          height={p.size}
          viewBox="0 0 24 24"
          className="absolute"
          style={{ filter: `drop-shadow(0 0 4px ${p.color})` }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: [0, 1.25, 0],
            opacity: [1, 1, 0],
            rotate: p.spin,
          }}
          transition={{ duration: 0.85, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" fill={p.color} />
        </motion.svg>
      ))}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { getSprite, spritePixels } from "./sprites";

interface Props {
  spriteId: string;
  /** Rendered width in px (height follows the sprite ratio). */
  size: number;
  className?: string;
  /** Explodes the sprite into flying pixels (boss defeated). */
  disintegrate?: boolean;
  grayscale?: boolean;
}

/** Pixel-art boss rendered as crisp SVG rects. */
export function BossSprite({ spriteId, size, className = "", disintegrate = false, grayscale = false }: Props) {
  const sprite = getSprite(spriteId);
  const { pixels, width, height } = useMemo(() => spritePixels(sprite), [sprite]);
  const scatter = useMemo(
    () =>
      pixels.map(() => ({
        dx: (Math.random() - 0.5) * 30,
        dy: -6 - Math.random() * 26,
        delay: Math.random() * 0.9,
        rotate: (Math.random() - 0.5) * 180,
      })),
    [pixels],
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={(size * height) / width}
      className={`pixelated overflow-visible ${className}`}
      style={grayscale ? { filter: "grayscale(1) brightness(0.75)" } : undefined}
      role="img"
      aria-label={sprite.name}
    >
      {pixels.map((p, i) =>
        disintegrate ? (
          <motion.rect
            key={i}
            x={p.x}
            y={p.y}
            width={1.02}
            height={1.02}
            fill={p.color}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            animate={{ opacity: 0, x: scatter[i].dx, y: scatter[i].dy, rotate: scatter[i].rotate }}
            transition={{ duration: 1.4, delay: scatter[i].delay, ease: "easeIn" }}
          />
        ) : (
          <rect key={i} x={p.x} y={p.y} width={1.02} height={1.02} fill={p.color} />
        ),
      )}
    </svg>
  );
}

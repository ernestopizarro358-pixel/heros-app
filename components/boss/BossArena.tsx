"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { bossHp } from "@/lib/boss";
import type { Boss } from "@/lib/data/types";
import { formatDayShort } from "@/lib/date";
import { useAppStore } from "@/lib/store/useAppStore";
import { useConfirm } from "../ui/ConfirmProvider";
import { TrashIcon } from "../ui/icons";
import { InlineEdit } from "../ui/InlineEdit";
import { LinkChip } from "../ui/LinkChip";
import { BossSprite } from "./BossSprite";
import { HpBar } from "./HpBar";
import { getSprite } from "./sprites";

export interface Hit {
  key: number;
  amount: number;
  crit: boolean;
}

interface FloatingNumber extends Hit {
  x: number;
}

interface Props {
  boss: Boss;
  hit: Hit | null;
  /** Victory sequence running for this boss. */
  defeated: boolean;
  onVictoryDone: () => void;
}

export function BossArena({ boss, hit, defeated, onVictoryDone }: Props) {
  const updateBoss = useAppStore((s) => s.updateBoss);
  const removeBoss = useAppStore((s) => s.removeBoss);
  const sourceInput = useAppStore((s) => {
    const src = boss.sourceInput;
    return src ? s.goals.find((g) => g.id === src.goalId)?.inputs.find((i) => i.id === src.inputId) : undefined;
  });
  const confirm = useConfirm();
  const hp = bossHp(boss);
  const sprite = getSprite(boss.spriteId);

  const spriteControls = useAnimationControls();
  const arenaControls = useAnimationControls();
  const [numbers, setNumbers] = useState<FloatingNumber[]>([]);
  const [flash, setFlash] = useState(0);
  // Ignore a hit that happened before this arena mounted (e.g. on another boss).
  const seenHit = useRef(hit?.key);

  useEffect(() => {
    if (!hit || hit.key === seenHit.current) return;
    seenHit.current = hit.key;
    setNumbers((list) => [...list, { ...hit, x: (Math.random() - 0.5) * 120 }]);
    setFlash(hit.key);
    const timer = setTimeout(() => setNumbers((list) => list.filter((n) => n.key !== hit.key)), 1400);

    void spriteControls.start({
      x: hit.crit ? [0, -18, 16, -12, 9, -5, 0] : [0, -9, 8, -5, 3, 0],
      filter: [
        "brightness(1) saturate(1)",
        "brightness(3) saturate(0)",
        "brightness(1) saturate(1.4) hue-rotate(-10deg)",
        "brightness(2.2) saturate(0)",
        "brightness(1) saturate(1)",
      ],
      transition: { duration: hit.crit ? 0.55 : 0.4 },
    });
    if (hit.crit) {
      void arenaControls.start({
        x: [0, -14, 12, -9, 7, -4, 0],
        y: [0, 6, -5, 4, -2, 0, 0],
        transition: { duration: 0.5 },
      });
      document.querySelector("main")?.animate(
        [
          { transform: "translate(0,0)" },
          { transform: "translate(-6px,4px)" },
          { transform: "translate(5px,-3px)" },
          { transform: "translate(-3px,2px)" },
          { transform: "translate(0,0)" },
        ],
        { duration: 380 },
      );
    }
    return () => clearTimeout(timer);
  }, [hit, spriteControls, arenaControls]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: `¿Borrar «${boss.name}»?`,
      message: "Se borrará el jefe con todo su registro de creencias, aprendizajes y soluciones.",
      confirmLabel: "Borrar jefe",
      danger: true,
    });
    if (ok) removeBoss(boss.id);
  };

  return (
    <motion.div
      animate={arenaControls}
      className="relative overflow-hidden rounded-2xl border border-[#e11d48]/25 bg-[radial-gradient(ellipse_at_50%_55%,#3b0a16_0%,#1c060c_45%,#0a0204_100%)] shadow-[0_0_60px_rgb(225_29_72/0.08)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(0_0_0/0.65)_100%)]" />

      {/* Header */}
      <div className="relative px-4 pt-5 sm:px-8 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold tracking-[0.3em] text-[#ff4d6d]">— JEFE {boss.number}</p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <InlineEdit
                value={boss.name}
                onSave={(name) => void updateBoss(boss.id, { name })}
                ariaLabel="Nombre del jefe"
                maxLength={80}
                className="text-2xl leading-tight font-extrabold tracking-tight text-ink sm:text-[2rem]"
              />
              <span className="font-mono text-[10.5px] text-muted">desde {formatDayShort(boss.startedAt)}</span>
            </div>
            {sourceInput && boss.sourceInput && (
              <div className="mt-2">
                <LinkChip href={`/ley-causal#input-${boss.sourceInput.inputId}`} icon="🎯" title="Input de la Ley Causal que este jefe frena">
                  Frena: {sourceInput.text}
                </LinkChip>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Borrar jefe"
            title="Borrar jefe"
            className="rounded-lg p-2 text-faint transition hover:bg-white/5 hover:text-rose-300"
          >
            <TrashIcon size={15} />
          </button>
        </div>
        <div className="mt-4 max-w-xl">
          <HpBar hp={hp} />
        </div>
      </div>

      {/* Stage */}
      <div className="relative flex h-[260px] items-center justify-center sm:h-[330px]">
        <div
          className="absolute h-56 w-56 rounded-full blur-3xl sm:h-72 sm:w-72"
          style={{ background: sprite.aura, opacity: defeated ? 0 : 0.55, transition: "opacity 1s" }}
        />
        <div className="absolute bottom-7 h-5 w-44 rounded-[50%] bg-black/70 blur-md sm:bottom-9" />

        <motion.div
          animate={defeated ? { y: 0 } : { y: [0, -7, 0] }}
          transition={defeated ? {} : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <motion.div animate={spriteControls} style={{ filter: "drop-shadow(0 10px 18px rgb(0 0 0 / 0.6))" }}>
            <BossSprite
              key={defeated ? "dead" : "alive"}
              spriteId={boss.spriteId}
              size={210}
              disintegrate={defeated}
              className="h-auto w-[170px] sm:w-[210px]"
            />
          </motion.div>
        </motion.div>

        {/* Damage numbers */}
        <AnimatePresence>
          {numbers.map((n) => (
            <motion.div
              key={n.key}
              className="pointer-events-none absolute top-1/3 left-1/2 z-10 -translate-x-1/2 text-center whitespace-nowrap"
              initial={{ opacity: 0, y: 10, x: n.x, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -90, x: n.x, scale: n.crit ? [0.6, 1.6, 1.3] : [0.6, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.3, ease: "easeOut" }}
            >
              {n.crit && (
                <p className="font-pixel text-[10px] text-gold [text-shadow:0_0_10px_rgb(251_191_36/0.8),2px_2px_0_#000]">¡CRÍTICO!</p>
              )}
              <p
                className={`font-pixel ${n.crit ? "text-3xl text-gold" : "text-xl text-[#ff4d6d]"}`}
                style={{ textShadow: "3px 3px 0 #000, 0 0 16px currentColor" }}
              >
                -{n.amount}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hit flash */}
        <AnimatePresence>
          {flash > 0 && (
            <motion.div
              key={flash}
              className="pointer-events-none absolute inset-0 bg-[#ff4d6d]"
              initial={{ opacity: 0.22 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
          )}
        </AnimatePresence>

        {/* Victory */}
        <AnimatePresence>
          {defeated && (
            <motion.div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 px-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1 }}
            >
              <motion.p
                className="font-pixel text-xl leading-relaxed text-gold sm:text-3xl"
                style={{ textShadow: "4px 4px 0 #3b0a16, 0 0 30px rgb(251 191 36 / 0.7)" }}
                initial={{ scale: 2.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 1.1 }}
              >
                ¡JEFE DERROTADO!
              </motion.p>
              <motion.p
                className="mt-4 max-w-sm text-sm text-soft"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
              >
                «{boss.name}» ya no manda. Pasa al Salón de jefes derrotados.
              </motion.p>
              <motion.button
                type="button"
                onClick={onVictoryDone}
                className="btn btn-light mt-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
              >
                Continuar
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

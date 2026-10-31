"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { Boss } from "@/lib/data/types";
import { formatDayShort, formatTimestampLong } from "@/lib/date";
import { TrophyIcon, XIcon } from "../ui/icons";
import { Modal } from "../ui/Modal";
import { SectionTitle } from "../ui/SectionTitle";
import { BossSprite } from "./BossSprite";
import { EntryLog } from "./EntryLog";

/** "Salón de jefes derrotados" with read-only history for each one. */
export function DefeatedHall({ bosses }: { bosses: Boss[] }) {
  const [open, setOpen] = useState<Boss | null>(null);
  if (bosses.length === 0) return null;

  const sorted = [...bosses].sort((a, b) => (b.defeatedAt ?? "").localeCompare(a.defeatedAt ?? ""));

  return (
    <section className="mt-14">
      <SectionTitle color="#c9922f">Salón de jefes derrotados</SectionTitle>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((boss, i) => (
          <motion.button
            key={boss.id}
            type="button"
            onClick={() => setOpen(boss)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex items-center gap-4 rounded-2xl border border-gold/15 bg-[linear-gradient(135deg,#14110a,#0c0b08)] p-4 text-left transition hover:border-gold/35"
          >
            <div className="relative shrink-0">
              <BossSprite spriteId={boss.spriteId} size={56} grayscale className="h-auto w-14 opacity-80 transition group-hover:opacity-100" />
              <span className="absolute -right-2 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[#3b1d06] shadow-[0_0_12px_rgb(251_191_36/0.6)]">
                <TrophyIcon size={13} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">
                Jefe {boss.number}: {boss.name}
              </p>
              <p className="mt-0.5 text-xs text-gold-soft/80">
                Derrotado el {boss.defeatedAt ? formatTimestampLong(boss.defeatedAt).toLowerCase() : "—"}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-faint">
                desde {formatDayShort(boss.startedAt)} · {boss.entries.length} entradas
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} className="max-w-3xl p-5 sm:p-6" labelledBy="hall-title">
        {open && (
          <>
            <div className="flex items-start gap-4">
              <BossSprite spriteId={open.spriteId} size={64} grayscale className="h-auto w-16 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] font-bold tracking-[0.3em] text-gold">— JEFE {open.number} · DERROTADO</p>
                <h2 id="hall-title" className="mt-1 text-xl font-bold">
                  {open.name}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Del {formatDayShort(open.startedAt)} al{" "}
                  {open.defeatedAt ? formatTimestampLong(open.defeatedAt).toLowerCase() : "—"}
                </p>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Cerrar" className="text-faint hover:text-ink">
                <XIcon size={18} />
              </button>
            </div>
            <div className="mt-5">
              <EntryLog boss={open} />
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}

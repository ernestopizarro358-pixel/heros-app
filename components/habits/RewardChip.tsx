"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, XIcon } from "../ui/icons";

interface Props {
  reward: string | null;
  onSave: (reward: string | null) => void;
}

/** "🎁 + Añadir recompensa" chip; becomes an inline editor when clicked. */
export function RewardChip({ reward, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reward ?? "");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(reward ?? "");
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [editing, reward]);

  const save = () => {
    onSave(draft.trim() || null);
    setEditing(false);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {editing ? (
        <motion.div
          key="edit"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex w-full max-w-md items-center gap-1.5"
        >
          <span aria-hidden>🎁</span>
          <input
            ref={input}
            value={draft}
            maxLength={140}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="Ej. 20 Bs para gastar en lo que quiera"
            aria-label="Recompensa"
            className="field !py-1.5 !text-[13px]"
          />
          <button onClick={save} aria-label="Guardar recompensa" className="rounded-md p-1.5 text-mint hover:bg-white/5">
            <CheckIcon size={16} />
          </button>
          {reward && (
            <button
              onClick={() => {
                onSave(null);
                setEditing(false);
              }}
              className="shrink-0 rounded-md px-2 py-1 text-[11px] text-rose-300/80 hover:bg-white/5"
            >
              Quitar
            </button>
          )}
          <button onClick={() => setEditing(false)} aria-label="Cancelar" className="rounded-md p-1.5 text-faint hover:bg-white/5">
            <XIcon size={14} />
          </button>
        </motion.div>
      ) : (
        <motion.button
          key="chip"
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditing(true)}
          title={reward ? "Editar recompensa" : "Añadir recompensa"}
          className={`chip ${reward ? "!border-gold/30 !bg-gold/[0.07] !text-gold-soft hover:!border-gold/50" : ""}`}
        >
          <span aria-hidden>🎁</span>
          <span className="truncate">{reward ?? "+ Añadir recompensa"}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

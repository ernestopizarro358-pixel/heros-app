"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PlusIcon } from "../ui/icons";

/** Bottom form: name + optional reward. Nothing else. */
export function AddHabitForm({ onAdd }: { onAdd: (name: string, reward: string | null) => void }) {
  const [name, setName] = useState("");
  const [reward, setReward] = useState("");
  const [withReward, setWithReward] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, withReward ? reward.trim() || null : null);
    setName("");
    setReward("");
    setWithReward(false);
  };

  return (
    <form onSubmit={submit} className="card p-3 sm:p-4">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={160}
          placeholder="Añade un hábito diario (por ejemplo, meditar 10 minutos)…"
          aria-label="Nuevo hábito"
          className="field min-w-0 flex-1 !text-[14px]"
        />
        <button type="submit" disabled={!name.trim()} className="btn btn-light shrink-0">
          <PlusIcon size={15} />
          Agregar
        </button>
      </div>

      <AnimatePresence initial={false}>
        {withReward ? (
          <motion.div
            key="reward"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-2">
              <span aria-hidden>🎁</span>
              <input
                autoFocus
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                maxLength={140}
                placeholder="Recompensa opcional (ej. 20 Bs para gastar en lo que quiera)"
                aria-label="Recompensa opcional"
                className="field !py-2 !text-[13px]"
              />
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="toggle"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWithReward(true)}
            className="chip mt-2"
          >
            🎁 + Añadir recompensa (opcional)
          </motion.button>
        )}
      </AnimatePresence>
    </form>
  );
}

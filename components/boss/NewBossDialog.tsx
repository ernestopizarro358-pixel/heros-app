"use client";

import { useEffect, useState } from "react";
import { BOSS_SPRITE_IDS } from "@/lib/game.config";
import { nextSpriteId, useAppStore } from "@/lib/store/useAppStore";
import { Modal } from "../ui/Modal";
import { BossSprite } from "./BossSprite";
import { getSprite } from "./sprites";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, spriteId: string) => void;
  initialName?: string;
  /** Extra line under the title (e.g. the input that this boss blocks). */
  context?: string;
}

export function NewBossDialog({ open, onClose, onCreate, initialName = "", context }: Props) {
  const nextNumber = useAppStore((s) => s.bosses.reduce((max, b) => Math.max(max, b.number), 0) + 1);
  const [name, setName] = useState(initialName);
  const [spriteId, setSpriteId] = useState<string>(nextSpriteId(nextNumber));

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setSpriteId(nextSpriteId(nextNumber));
  }, [open, initialName, nextNumber]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), spriteId);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg p-5 sm:p-6" labelledBy="new-boss-title">
      <form onSubmit={submit}>
        <p className="font-mono text-[10px] font-bold tracking-[0.3em] text-[#ff4d6d]">— JEFE {nextNumber}</p>
        <h2 id="new-boss-title" className="mt-1 text-xl font-bold">
          Nuevo jefe
        </h2>
        {context && <p className="mt-1 text-sm text-muted">{context}</p>}

        <label className="mt-5 block">
          <span className="label">¿Qué te frena?</span>
          <input
            autoFocus
            className="field mt-2"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Miedo a la incomodidad, No voy al gimnasio…"
          />
        </label>

        <p className="label mt-5">Elige su forma</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {BOSS_SPRITE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSpriteId(id)}
              aria-pressed={spriteId === id}
              title={getSprite(id).name}
              className={`flex aspect-square items-center justify-center rounded-xl border p-2 transition ${
                spriteId === id
                  ? "border-[#ff4d6d]/70 bg-[radial-gradient(circle,#3b0a16,#140408)] shadow-[0_0_18px_rgb(225_29_72/0.3)]"
                  : "border-line bg-[#0c0c0c] opacity-60 hover:opacity-100"
              }`}
            >
              <BossSprite spriteId={id} size={56} className="h-auto w-full" />
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted">{getSprite(spriteId).name}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn bg-[linear-gradient(180deg,#e11d48,#9f1239)] text-white shadow-[0_0_20px_rgb(225_29_72/0.3)]"
          >
            Invocar jefe
          </button>
        </div>
      </form>
    </Modal>
  );
}

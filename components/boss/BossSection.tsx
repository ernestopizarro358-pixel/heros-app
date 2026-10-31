"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { bossHp, entryDamage } from "@/lib/boss";
import { RED_CONFETTI, celebrate } from "@/lib/confetti";
import type { BossEntry } from "@/lib/data/types";
import { SOLUTION_DAMAGE } from "@/lib/game.config";
import { sfx } from "@/lib/sound";
import { useAppStore, type NewEntry } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToast";
import { useHashFocus } from "@/lib/useHashFocus";
import { useConfirm } from "../ui/ConfirmProvider";
import { PlusIcon } from "../ui/icons";
import { SectionTitle } from "../ui/SectionTitle";
import { AttackBar } from "./AttackBar";
import { BossArena, type Hit } from "./BossArena";
import { BossSprite } from "./BossSprite";
import { DefeatedHall } from "./DefeatedHall";
import { EntryLog } from "./EntryLog";
import type { EntryActions } from "./EntryItem";
import { NewBossDialog } from "./NewBossDialog";

const currentBoss = (id: string) => useAppStore.getState().bosses.find((b) => b.id === id);

export function BossSection() {
  const bosses = useAppStore((s) => s.bosses);
  const addBoss = useAppStore((s) => s.addBoss);
  const addEntry = useAppStore((s) => s.addEntry);
  const updateEntry = useAppStore((s) => s.updateEntry);
  const removeEntry = useAppStore((s) => s.removeEntry);
  const updateBoss = useAppStore((s) => s.updateBoss);
  const convertSolutionToHabit = useAppStore((s) => s.convertSolutionToHabit);
  const confirm = useConfirm();
  const router = useRouter();
  const params = useSearchParams();

  const active = useMemo(() => bosses.filter((b) => !b.defeatedAt).sort((a, b) => a.number - b.number), [bosses]);
  const defeated = useMemo(() => bosses.filter((b) => b.defeatedAt), [bosses]);

  const [selectedId, setSelectedId] = useState<string | null>(params.get("boss"));
  const [victoryId, setVictoryId] = useState<string | null>(null);
  const [hit, setHit] = useState<Hit | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  useHashFocus();

  // The boss shown in the arena: the one being defeated, the selected one, or the first alive.
  const boss =
    bosses.find((b) => b.id === victoryId) ??
    active.find((b) => b.id === selectedId) ??
    active[0] ??
    null;

  useEffect(() => {
    const fromUrl = params.get("boss");
    if (fromUrl) setSelectedId(fromUrl);
  }, [params]);

  const select = (id: string) => {
    setSelectedId(id);
    router.replace(`/jefe?boss=${id}`, { scroll: false });
  };

  /** Plays the hit and checks for victory. */
  const landHit = useCallback(
    (bossId: string, amount: number, crit: boolean) => {
      if (amount <= 0) return;
      setHit({ key: Date.now(), amount, crit });
      if (crit) sfx.crit();
      else sfx.hit();
      const updated = currentBoss(bossId);
      if (updated && !updated.defeatedAt && bossHp(updated) === 0) {
        setVictoryId(bossId);
        void updateBoss(bossId, { defeatedAt: new Date().toISOString() });
        setTimeout(() => {
          sfx.victory();
          celebrate(RED_CONFETTI);
        }, 900);
      }
    },
    [updateBoss],
  );

  const attack = (entry: NewEntry) => {
    if (!boss) return;
    const created = addEntry(boss.id, entry);
    if (created.type === "solution") {
      toast(`Solución añadida. Hará −${SOLUTION_DAMAGE[created.size ?? "small"]} HP cuando la cumplas.`, "success");
      return;
    }
    landHit(boss.id, entryDamage(created), false);
  };

  const actions: EntryActions | undefined = boss
    ? {
        onDelete: async (entry: BossEntry) => {
          const damage = entryDamage(entry);
          const ok = await confirm({
            title: "¿Borrar esta entrada?",
            message: damage > 0 ? `El jefe recupera ${damage} HP.` : undefined,
            confirmLabel: "Borrar",
            danger: true,
          });
          if (ok) removeEntry(boss.id, entry.id);
        },
        onToggleDone: (entry, done) => {
          const before = bossHp(boss);
          void updateEntry(boss.id, entry.id, { completedAt: done ? new Date().toISOString() : null });
          if (done) landHit(boss.id, before - bossHp(currentBoss(boss.id)!), true);
        },
        onProgress: (entry, progress) => {
          const target = entry.target ?? 1;
          const next = Math.max(0, Math.min(progress, target));
          const before = bossHp(boss);
          void updateEntry(boss.id, entry.id, {
            progress: next,
            completedAt: next >= target ? new Date().toISOString() : null,
          });
          const dealt = before - bossHp(currentBoss(boss.id)!);
          if (dealt > 0) landHit(boss.id, dealt, next >= target);
          else if (next > (entry.progress ?? 0)) sfx.tick();
        },
        onConvertToHabit: (entry) => {
          const habit = convertSolutionToHabit(boss.id, entry.id);
          if (habit) toast(`Hábito creado: «${habit.name}» ⚡`, "success");
        },
      }
    : undefined;

  const createBoss = (name: string, spriteId: string) => {
    const created = addBoss(name, { spriteId });
    select(created.id);
  };

  return (
    <section>
      <BossAtmosphere />
      <SectionTitle
        color="#ff4d6d"
        action={
          <button type="button" onClick={() => setNewOpen(true)} className="chip hover:!border-[#ff4d6d]/50 hover:!text-[#ff8197]">
            <PlusIcon size={12} /> Nuevo jefe
          </button>
        }
      >
        Lucha contra el jefe
      </SectionTitle>

      {active.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {active.map((b) => {
            const selected = b.id === boss?.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => select(b.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                  selected ? "border-[#ff4d6d]/50 bg-[#1f070d] shadow-[0_0_18px_rgb(225_29_72/0.18)]" : "border-line bg-surface opacity-70 hover:opacity-100"
                }`}
              >
                <BossSprite spriteId={b.spriteId} size={28} className="h-auto w-7" />
                <span>
                  <span className="block font-mono text-[9.5px] font-bold tracking-[0.2em] text-[#ff4d6d]">JEFE {b.number}</span>
                  <span className="block max-w-[11rem] truncate text-[13px] font-semibold text-ink">{b.name}</span>
                </span>
                <span className="ml-1 font-mono text-[10px] text-muted">{bossHp(b)} HP</span>
              </button>
            );
          })}
        </div>
      )}

      {boss ? (
        <div className="mt-4 space-y-4">
          <BossArena
            key={boss.id}
            boss={boss}
            hit={hit}
            defeated={boss.id === victoryId}
            onVictoryDone={() => {
              setVictoryId(null);
              setHit(null);
            }}
          />
          {boss.id !== victoryId && (
            <>
              <AttackBar onAttack={attack} />
              <EntryLog boss={boss} actions={actions} />
            </>
          )}
        </div>
      ) : (
        <EmptyBosses onCreate={() => setNewOpen(true)} hasDefeated={defeated.length > 0} />
      )}

      <DefeatedHall bosses={defeated.filter((b) => b.id !== victoryId)} />

      <NewBossDialog open={newOpen} onClose={() => setNewOpen(false)} onCreate={createBoss} />
    </section>
  );
}

function EmptyBosses({ onCreate, hasDefeated }: { onCreate: () => void; hasDefeated: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex flex-col items-center rounded-2xl border border-[#e11d48]/20 bg-[radial-gradient(ellipse_at_center,#2a0710_0%,#0c0305_75%)] px-6 py-12 text-center"
    >
      <BossSprite spriteId="knight" size={110} grayscale className="h-auto w-[110px] opacity-60" />
      <p className="mt-6 text-xl font-bold">{hasDefeated ? "No queda ningún jefe en pie" : "Ningún jefe a la vista… todavía"}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Un jefe es el miedo, la creencia o el bloqueo que no te deja hacer los inputs que ya sabes que funcionan. Ponle
        nombre y empieza a bajarle la vida.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="btn mt-6 bg-[linear-gradient(180deg,#e11d48,#9f1239)] text-white shadow-[0_0_24px_rgb(225_29_72/0.35)]"
      >
        <PlusIcon size={15} /> Invocar un jefe
      </button>
    </motion.div>
  );
}

function BossAtmosphere() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(ellipse 70% 45% at 50% 30%, rgb(159 18 57 / 0.13), transparent 70%), radial-gradient(ellipse at center, transparent 50%, rgb(20 0 4 / 0.6) 100%)",
      }}
    />
  );
}

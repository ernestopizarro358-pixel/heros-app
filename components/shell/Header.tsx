"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { SoundOffIcon, SoundOnIcon } from "../ui/icons";
import { SettingsDialog } from "./SettingsDialog";

export function Header() {
  const ready = useAppStore((s) => s.ready);
  const userName = useAppStore((s) => s.settings.userName);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-4">
      <h1 className="min-w-0 text-[1.4rem] leading-tight font-bold tracking-tight text-ink sm:text-3xl">
        Bienvenido, <span className={ready ? "" : "opacity-0"}>{userName}</span>
      </h1>

      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={() => void updateSettings({ soundEnabled: !soundEnabled })}
          aria-label={soundEnabled ? "Silenciar sonidos" : "Activar sonidos"}
          title={soundEnabled ? "Silenciar sonidos" : "Activar sonidos"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-muted transition hover:text-ink"
        >
          {soundEnabled ? <SoundOnIcon size={15} /> : <SoundOffIcon size={15} />}
        </button>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Abrir ajustes"
          title="Ajustes"
          className="group relative h-11 w-11 rounded-full p-[2px] transition hover:scale-105"
          style={{ background: "conic-gradient(from 200deg, #5eead4, #818cf8, #c084fc, #5eead4)" }}
        >
          <span className="absolute inset-0 rounded-full opacity-60 blur-md transition group-hover:opacity-90" style={{ background: "conic-gradient(from 200deg, #5eead4, #818cf8, #c084fc, #5eead4)" }} />
          <span className="relative flex h-full w-full items-center justify-center rounded-full bg-[#0d0d14] text-base font-bold text-ink">
            {(userName || "S").charAt(0).toUpperCase()}
          </span>
        </button>
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}

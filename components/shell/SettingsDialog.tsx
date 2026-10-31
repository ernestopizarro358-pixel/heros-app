"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { DATA_BACKEND } from "@/lib/data";
import { looksLikeBackup } from "@/lib/data/normalize";
import { todayKey } from "@/lib/date";
import { useAppStore } from "@/lib/store/useAppStore";
import { useConfirm } from "../ui/ConfirmProvider";
import { DownloadIcon, UploadIcon, XIcon } from "../ui/icons";
import { Modal } from "../ui/Modal";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);
  const confirm = useConfirm();
  const cloud = DATA_BACKEND === "supabase";
  const email = useAuth((s) => s.email);
  const signOut = useAuth((s) => s.signOut);

  const [name, setName] = useState(settings.userName);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(settings.userName);
      setMessage(null);
    }
  }, [open, settings.userName]);

  const saveName = () => {
    const next = name.trim();
    if (next && next !== settings.userName) void updateSettings({ userName: next });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heroes-app-respaldo-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ tone: "ok", text: "Respaldo descargado ✓" });
  };

  const handleImport = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text());
      if (!looksLikeBackup(raw)) throw new Error("Ese archivo no parece un respaldo de Heroes App.");
      const ok = await confirm({
        title: "¿Reemplazar todos tus datos?",
        message: "Se sustituirá todo lo que hay ahora en la app por el contenido del respaldo. Te recomiendo exportar antes.",
        confirmLabel: "Importar",
        danger: true,
      });
      if (!ok) return;
      await importData(raw);
      setMessage({ tone: "ok", text: "Datos importados ✓" });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof SyntaxError ? "El archivo no es un JSON válido." : (error as Error).message,
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-md p-6" labelledBy="settings-title">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Ajustes</p>
          <h2 id="settings-title" className="mt-1 text-xl font-bold">
            Tu Heroes App
          </h2>
        </div>
        <button onClick={onClose} aria-label="Cerrar" className="text-faint hover:text-ink">
          <XIcon size={18} />
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {cloud && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-[#0b0b0b] p-4">
            <div className="min-w-0">
              <p className="label">Cuenta</p>
              <p className="mt-1 truncate text-sm font-semibold">{email}</p>
              <p className="text-xs text-muted">Tus datos se guardan en la nube.</p>
            </div>
            <button
              className="btn btn-ghost shrink-0"
              onClick={() => {
                onClose();
                void signOut();
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}

        <label className="block">
          <span className="label">Tu nombre</span>
          <input
            className="field mt-2"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur(), saveName())}
          />
        </label>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Sonidos</p>
            <p className="text-xs text-muted">Un sonido corto al completar hábitos y atacar jefes.</p>
          </div>
          <button
            role="switch"
            aria-checked={settings.soundEnabled}
            aria-label="Sonidos"
            onClick={() => void updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${settings.soundEnabled ? "bg-mint" : "bg-line-strong"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.soundEnabled ? "left-[22px]" : "left-0.5"}`}
            />
          </button>
        </div>

        <div className="rounded-xl border border-line bg-[#0b0b0b] p-4">
          <p className="text-sm font-semibold">Respaldo de datos</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {cloud
              ? "Tus datos están en tu cuenta. Aun así, exporta un JSON de vez en cuando como copia extra; al importar uno se reemplaza todo lo de tu cuenta."
              : "Tus datos viven en este navegador. Exporta un JSON de vez en cuando para no perder nada, o para pasarlos a otro dispositivo."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-light" onClick={handleExport}>
              <DownloadIcon size={15} /> Exportar JSON
            </button>
            <button className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
              <UploadIcon size={15} /> Importar JSON
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleImport(file);
              }}
            />
          </div>
          {message && (
            <p className={`mt-3 text-xs ${message.tone === "ok" ? "text-mint" : "text-rose-400"}`}>{message.text}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import type { VisionKind } from "@/lib/data/types";
import { exportBoardPng } from "@/lib/images";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToast";
import { todayKey } from "@/lib/date";
import { DownloadIcon, PlusIcon } from "../ui/icons";
import { ImageSlot } from "./ImageSlot";
import { Lightbox } from "./Lightbox";
import { VisionLabel } from "./VisionLabel";

export function InspirationBoard({ kind, hint }: { kind: VisionKind; hint: string }) {
  const slots = useAppStore((s) => s.visions[kind].inspiration);
  const updateVision = useAppStore((s) => s.updateVision);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const filled = slots.filter((u): u is string => !!u);

  const setSlot = (index: number, url: string | null) => {
    void updateVision(kind, { inspiration: slots.map((u, i) => (i === index ? url : u)) });
  };

  const addRow = () => void updateVision(kind, { inspiration: [...slots, null, null, null, null] });

  const removeEmptyRow = () => {
    // Only trims trailing empty slots, never below 8.
    let next = [...slots];
    while (next.length > 8 && next.slice(-4).every((u) => !u)) next = next.slice(0, -4);
    void updateVision(kind, { inspiration: next });
  };

  const download = async () => {
    if (filled.length === 0) return toast("Añade alguna imagen antes de descargar el tablero.", "info");
    setExporting(true);
    try {
      const { exported, skipped } = await exportBoardPng(slots, {
        title: kind === "portal" ? "Portal · Tablero de inspiración" : "Antiportal · Tablero de inspiración",
        filename: `${kind}-tablero-${todayKey()}.png`,
        dark: kind === "antiportal",
      });
      if (exported === 0) {
        toast(
          "No se pudo crear el PNG: el sitio de origen de las imágenes no permite exportarlas (CORS). Puedes hacer una captura de pantalla del tablero.",
          "warning",
          8000,
        );
      } else if (skipped > 0) {
        toast(`PNG descargado. ${skipped} imagen(es) no se pudieron incluir porque su sitio no lo permite (CORS).`, "warning", 7000);
      } else {
        toast("Tablero descargado ✓", "success");
      }
    } catch {
      toast("No se pudo generar el PNG del tablero.", "error");
    } finally {
      setExporting(false);
    }
  };

  const trailingEmptyRow = slots.length > 8 && slots.slice(-4).every((u) => !u);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <VisionLabel>Tablero de inspiración</VisionLabel>
        <button type="button" onClick={download} disabled={exporting} className="btn btn-ghost btn-mono">
          <DownloadIcon size={12} />
          {exporting ? "Generando…" : "Descargar PNG"}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">{hint}</p>

      <div className="mt-3 rounded-2xl border border-[var(--v-border)] bg-[var(--v-card)] p-2.5 shadow-[0_0_40px_var(--v-glow)] sm:p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          {slots.map((url, i) => (
            <ImageSlot
              key={i}
              url={url}
              label={`Imagen ${i + 1} del tablero`}
              className="aspect-[3/4]"
              onChange={(next) => setSlot(i, next)}
              onOpen={() => setLightbox(filled.indexOf(url!))}
            />
          ))}
        </div>
        <div className="mt-2.5 flex justify-center gap-2">
          <button type="button" onClick={addRow} className="btn btn-ghost btn-mono">
            <PlusIcon size={12} /> 4 huecos más
          </button>
          {trailingEmptyRow && (
            <button type="button" onClick={removeEmptyRow} className="btn btn-ghost btn-mono">
              Quitar fila vacía
            </button>
          )}
        </div>
      </div>

      <Lightbox images={filled} index={lightbox} onClose={() => setLightbox(null)} onIndexChange={setLightbox} />
    </div>
  );
}

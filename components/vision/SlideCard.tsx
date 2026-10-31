"use client";

import { useState } from "react";
import type { VisionKind, VisionSlide } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/useAppStore";
import { AutosaveTextarea } from "../ui/AutosaveTextarea";
import { useConfirm } from "../ui/ConfirmProvider";
import { BookIcon, XIcon } from "../ui/icons";
import { InlineEdit } from "../ui/InlineEdit";
import { GENERIC_SLIDE_PLACEHOLDER, VISION_COPY } from "./copy";
import { ImageSlot } from "./ImageSlot";
import { Lightbox } from "./Lightbox";

interface Props {
  kind: VisionKind;
  slide: VisionSlide;
  index: number;
  onRead: (slideId: string) => void;
}

/** 2×2 images on the left, text on the right (stacked on mobile). */
export function SlideCard({ kind, slide, index, onRead }: Props) {
  const updateSlide = useAppStore((s) => s.updateSlide);
  const removeSlide = useAppStore((s) => s.removeSlide);
  const confirm = useConfirm();
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filled = slide.images.filter((u): u is string => !!u);
  const placeholder = VISION_COPY[kind].slidePlaceholders[slide.key] ?? GENERIC_SLIDE_PLACEHOLDER;

  const setImage = (i: number, url: string | null) =>
    void updateSlide(kind, slide.id, { images: slide.images.map((u, j) => (j === i ? url : u)) });

  const handleDelete = async () => {
    const ok = await confirm({
      title: `¿Borrar la slide «${slide.title}»?`,
      message: "Se borrarán su texto y sus imágenes.",
      confirmLabel: "Borrar",
      danger: true,
    });
    if (ok) removeSlide(kind, slide.id);
  };

  return (
    <article id={`slide-${slide.id}`} className="scroll-mt-6">
      <p className="label mb-2 !text-[var(--v-label)] opacity-80">Diapositiva {String(index + 1).padStart(2, "0")}</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:gap-4">
        <div className="self-start rounded-2xl border border-[var(--v-border)] bg-[var(--v-card)] p-2 sm:sticky sm:top-4">
          <div className="grid grid-cols-2 gap-2">
            {slide.images.map((url, i) => (
              <ImageSlot
                key={i}
                url={url}
                label={`Imagen ${i + 1} de ${slide.title}`}
                className="aspect-square"
                onChange={(next) => setImage(i, next)}
                onOpen={() => setLightbox(filled.indexOf(url!))}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--v-border)] bg-[var(--v-card)] px-4 pt-3.5 pb-8 sm:px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-[var(--v-accent)]">SLIDE ·</span>
              <InlineEdit
                value={slide.title}
                onSave={(title) => void updateSlide(kind, slide.id, { title: title.toUpperCase() })}
                ariaLabel="Título de la slide"
                maxLength={40}
                className="font-mono text-[13px] font-bold tracking-[0.14em] text-[var(--v-accent)] uppercase"
              />
            </div>
            <div className="-mr-1.5 flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => onRead(slide.id)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5 hover:text-ink"
                title="Leer en pantalla completa"
              >
                <BookIcon size={14} /> Leer
              </button>
              <button
                type="button"
                onClick={handleDelete}
                aria-label={`Borrar slide ${slide.title}`}
                title="Borrar slide"
                className="rounded-lg p-1.5 text-faint transition hover:bg-white/5 hover:text-rose-300"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>

          <AutosaveTextarea
            value={slide.text}
            onSave={(text) => updateSlide(kind, slide.id, { text })}
            placeholder={placeholder}
            minRows={6}
            ariaLabel={`Texto de la slide ${slide.title}`}
            className="mt-2"
            indicatorClassName="absolute -bottom-6 right-0"
          />
        </div>
      </div>

      <Lightbox images={filled} index={lightbox} onClose={() => setLightbox(null)} onIndexChange={setLightbox} />
    </article>
  );
}

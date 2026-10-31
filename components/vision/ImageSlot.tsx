"use client";

import { useCallback, useEffect, useState } from "react";
import { checkImageUrl, setHoveredPasteTarget } from "@/lib/images";
import { toast } from "@/lib/store/useToast";
import { PlusIcon, RefreshIcon, XIcon } from "../ui/icons";
import { ImageUrlDialog } from "./ImageUrlDialog";

interface Props {
  url: string | null;
  onChange: (url: string | null) => void;
  onOpen?: () => void;
  label: string;
  className?: string;
}

/** One image hole: "+" when empty, image with Cambiar / Quitar on hover when filled. */
export function ImageSlot({ url, onChange, onOpen, label, className = "" }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => setBroken(false), [url]);

  const handlePaste = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast("Pega la URL de la imagen (no la imagen en sí).", "warning");
        return;
      }
      setChecking(true);
      const result = await checkImageUrl(text);
      setChecking(false);
      if (result.ok) onChange(result.url);
      else toast(result.message, "warning", 6500);
    },
    [onChange],
  );

  const hoverHandlers = {
    onMouseEnter: () => setHoveredPasteTarget((text) => void handlePaste(text)),
    onMouseLeave: () => setHoveredPasteTarget(null),
  };

  const base = `group relative overflow-hidden rounded-xl ${className}`;

  if (!url) {
    return (
      <>
        <button
          type="button"
          {...hoverHandlers}
          onPaste={(e) => {
            e.preventDefault();
            void handlePaste(e.clipboardData.getData("text/plain"));
          }}
          onClick={() => setDialogOpen(true)}
          aria-label={`${label}: añadir imagen`}
          title="Añadir imagen (o pasa el mouse y pulsa Ctrl+V)"
          className={`${base} flex items-center justify-center border border-dashed border-[var(--v-border-strong)] bg-[var(--v-card-2)] text-faint transition hover:border-[var(--v-accent)]/50 hover:text-[var(--v-accent)] focus-visible:border-[var(--v-accent)] focus-visible:outline-none`}
        >
          {checking ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <PlusIcon size={18} className="transition group-hover:scale-125" />
          )}
        </button>
        <ImageUrlDialog open={dialogOpen} initialUrl={null} onClose={() => setDialogOpen(false)} onSave={onChange} />
      </>
    );
  }

  return (
    <>
      <div className={`${base} border border-[var(--v-border)] bg-[var(--v-card-2)]`} {...hoverHandlers}>
        {broken ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-[11px] text-faint">
            <span>Imagen no disponible</span>
          </div>
        ) : (
          <button type="button" onClick={onOpen} aria-label={`${label}: ver en grande`} className="block h-full w-full cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setBroken(true)}
              className="vision-img h-full w-full object-cover group-hover:scale-[1.03]"
            />
          </button>
        )}

        <div className="hover-reveal absolute top-1.5 right-1.5 flex gap-1">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            aria-label={`${label}: cambiar imagen`}
            title="Cambiar"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white/85 backdrop-blur transition hover:bg-black/90 hover:text-white"
          >
            <RefreshIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`${label}: quitar imagen`}
            title="Quitar"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white/85 backdrop-blur transition hover:bg-black/90 hover:text-rose-300"
          >
            <XIcon size={13} />
          </button>
        </div>
      </div>
      <ImageUrlDialog open={dialogOpen} initialUrl={url} onClose={() => setDialogOpen(false)} onSave={onChange} />
    </>
  );
}

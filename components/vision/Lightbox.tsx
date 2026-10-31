"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRightIcon, XIcon } from "../ui/icons";

interface Props {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/** Full-screen image viewer with ← / → navigation. */
export function Lightbox({ images, index, onClose, onIndexChange }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const open = index !== null && images.length > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange(((index ?? 0) + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange(((index ?? 0) - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[960] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
        >
          <AnimatePresence mode="wait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={images[index!]}
              src={images[index!]}
              alt=""
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            />
          </AnimatePresence>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <XIcon size={18} />
          </button>

          {images.length > 1 && (
            <>
              <button
                aria-label="Anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange((index! - 1 + images.length) % images.length);
                }}
                className="absolute left-3 flex h-11 w-11 rotate-180 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowRightIcon size={18} />
              </button>
              <button
                aria-label="Siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange((index! + 1) % images.length);
                }}
                className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowRightIcon size={18} />
              </button>
              <p className="label absolute bottom-4 !text-white/60">
                {index! + 1} / {images.length}
              </p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

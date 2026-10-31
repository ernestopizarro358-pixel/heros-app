"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { VisionKind } from "@/lib/data/types";
import { XIcon } from "../ui/icons";

export interface ReadingSection {
  id: string;
  title: string;
  text: string;
  images: string[];
}

const SIZE_KEY = "heroes-app:reading-size";
const SIZES = [17, 19, 21, 23, 26];

function readStoredSize(): number {
  try {
    const stored = Number(window.localStorage.getItem(SIZE_KEY));
    return SIZES.includes(stored) ? stored : 21;
  } catch {
    return 21;
  }
}

/** Distraction-free, full-screen reader — made for reading the Portal every morning. */
export function ReadingMode({
  kind,
  sections,
  onClose,
}: {
  kind: VisionKind;
  sections: ReadingSection[] | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState(21);
  const open = !!sections;
  const anti = kind === "antiportal";

  useEffect(() => {
    setMounted(true);
    setSize(readStoredSize());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  const changeSize = (delta: number) => {
    const next = SIZES[Math.min(SIZES.length - 1, Math.max(0, SIZES.indexOf(size) + delta))];
    setSize(next);
    try {
      window.localStorage.setItem(SIZE_KEY, String(next));
    } catch {
      /* per-device preference only */
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[940] overflow-y-auto ${anti ? "theme-antiportal bg-[#080505]" : "bg-[#060606]"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Modo lectura"
        >
          <div
            className="pointer-events-none fixed inset-0"
            style={{
              background: anti
                ? "radial-gradient(ellipse at center, transparent 35%, rgb(40 4 4 / 0.75) 100%)"
                : "radial-gradient(ellipse 70% 45% at 50% 0%, rgb(94 234 212 / 0.07), transparent 70%)",
            }}
          />
          {anti && <div className="grain pointer-events-none fixed inset-0" />}

          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.04] bg-black/50 px-4 py-3 backdrop-blur-md sm:px-8">
            <p className="label !text-[var(--v-label)]">Modo lectura · {anti ? "Antiportal" : "Portal"}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => changeSize(-1)}
                aria-label="Letra más pequeña"
                className="h-9 w-9 rounded-full text-sm text-soft hover:bg-white/10"
              >
                A−
              </button>
              <button
                onClick={() => changeSize(1)}
                aria-label="Letra más grande"
                className="h-9 w-9 rounded-full text-lg text-soft hover:bg-white/10"
              >
                A+
              </button>
              <button
                onClick={onClose}
                aria-label="Cerrar modo lectura"
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>

          <motion.article
            className="relative mx-auto max-w-[68ch] px-5 pt-10 pb-32 sm:px-8 sm:pt-14"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            {sections!.map((section, i) => (
              <section key={section.id} className={i > 0 ? "mt-20" : ""}>
                {section.images.length > 0 && (
                  <div className="group mb-8 grid grid-cols-4 gap-2 opacity-90">
                    {section.images.slice(0, 4).map((src, j) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={j}
                        src={src}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="vision-img aspect-[3/4] w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
                <h2
                  className="text-3xl font-extrabold tracking-tight sm:text-4xl"
                  style={{
                    color: anti ? "#d97b7b" : "#f4f4f5",
                    textShadow: anti ? "0 0 30px rgb(194 84 84 / 0.25)" : "0 0 30px rgb(94 234 212 / 0.18)",
                  }}
                >
                  {section.title}
                </h2>
                <div className="mt-2 h-px w-16 bg-[var(--v-accent)] opacity-60" />
                <p
                  className="mt-6 whitespace-pre-wrap text-[var(--v-text)]"
                  style={{ fontSize: size, lineHeight: 1.8 }}
                >
                  {section.text.trim() || <span className="text-faint italic">Aún no has escrito nada aquí.</span>}
                </p>
              </section>
            ))}
            <p className="mt-24 text-center font-mono text-xs tracking-[0.4em] text-faint">· · ·</p>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

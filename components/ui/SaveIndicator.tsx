"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SaveStatus } from "./useAutosave";

export function SaveIndicator({ status, className = "" }: { status: SaveStatus; className?: string }) {
  return (
    <span className={`label pointer-events-none inline-flex h-4 items-center ${className}`} aria-live="polite">
      <AnimatePresence mode="wait">
        {status !== "idle" && (
          <motion.span
            key={status}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={status === "saved" ? "text-mint/80" : ""}
          >
            {status === "saving" ? "Guardando…" : "Guardado ✓"}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToast, type ToastTone } from "@/lib/store/useToast";
import { XIcon } from "./icons";

const TONE: Record<ToastTone, string> = {
  info: "border-line-strong bg-[#141414] text-soft",
  success: "border-mint/30 bg-[#0c1715] text-mint",
  warning: "border-gold/30 bg-[#17130a] text-gold-soft",
  error: "border-crimson/40 bg-[#1a0b0e] text-rose-200",
};

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[990] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-snug shadow-2xl backdrop-blur ${TONE[t.tone]}`}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="opacity-60 hover:opacity-100">
              <XIcon size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

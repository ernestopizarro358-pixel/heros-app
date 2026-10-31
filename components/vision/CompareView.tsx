"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { VisionBoard, VisionSlide } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/useAppStore";
import { XIcon } from "../ui/icons";

type Topic = { id: string; title: string; portal: Side; antiportal: Side };
type Side = { text: string; images: string[] };

const images = (slide?: VisionSlide) => (slide?.images ?? []).filter((u): u is string => !!u);

/** Pairs Portal and Antiportal content: slides by key (fallback: position). */
function buildTopics(portal: VisionBoard, anti: VisionBoard): Topic[] {
  const slides: Topic[] = portal.slides.map((slide, i) => {
    const match = anti.slides.find((s) => s.key === slide.key) ?? anti.slides[i];
    return {
      id: slide.id,
      title: slide.title,
      portal: { text: slide.text, images: images(slide) },
      antiportal: { text: match?.text ?? "", images: images(match) },
    };
  });
  return [
    ...slides,
    {
      id: "day",
      title: "Mi día",
      portal: { text: portal.text, images: [] },
      antiportal: { text: anti.text, images: [] },
    },
    {
      id: "beliefs",
      title: "Creencias",
      portal: { text: portal.beliefs, images: [] },
      antiportal: { text: anti.beliefs, images: [] },
    },
  ];
}

/** "YO dentro de un año: si hago las cosas bien / si sigo igual". */
export function CompareView({ open, onClose, initialTopic }: { open: boolean; onClose: () => void; initialTopic?: string }) {
  const visions = useAppStore((s) => s.visions);
  const topics = useMemo(() => buildTopics(visions.portal, visions.antiportal), [visions]);
  const [topicId, setTopicId] = useState<string>(topics[0]?.id ?? "day");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setTopicId(initialTopic && topics.some((t) => t.id === initialTopic) ? initialTopic : topics[0]?.id ?? "day");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  if (!mounted) return null;
  const topic = topics.find((t) => t.id === topicId) ?? topics[0];

  return createPortal(
    <AnimatePresence>
      {open && topic && (
        <motion.div
          className="fixed inset-0 z-[930] overflow-y-auto bg-[#050505]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Portal vs Antiportal"
        >
          <div className="sticky top-0 z-10 border-b border-white/[0.05] bg-black/70 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 sm:px-6">
              <p className="label">
                <span className="text-mint">Portal</span> vs <span className="text-[#c25454]">Antiportal</span>
              </p>
              <button
                onClick={onClose}
                aria-label="Cerrar comparación"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="no-scrollbar mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 py-3 sm:px-6">
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopicId(t.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase transition ${
                    t.id === topic.id ? "border-white/25 bg-white/10 text-ink" : "border-line text-faint hover:text-soft"
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6">
            <motion.h2
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-2xl font-extrabold tracking-tight sm:text-4xl"
            >
              {topic.title} <span className="font-semibold text-muted">dentro de un año</span>
            </motion.h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
              <ComparePanel side={topic.portal} anti={false} />
              <ComparePanel side={topic.antiportal} anti />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ComparePanel({ side, anti }: { side: Side; anti: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: anti ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: anti ? 0.1 : 0 }}
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-6 ${
        anti
          ? "theme-antiportal border-[#3d2121] bg-[radial-gradient(ellipse_at_center,#120c0c_30%,#0a0505_100%)]"
          : "border-mint/20 bg-[radial-gradient(ellipse_at_top,#0f1a18_0%,#0b0b0b_70%)] shadow-[0_0_50px_rgb(94_234_212/0.07)]"
      }`}
    >
      {anti && <div className="grain pointer-events-none absolute inset-0" />}
      <p className={`label ${anti ? "!text-[#c25454]" : "!text-mint"}`}>{anti ? "Si sigo igual" : "Si hago las cosas bien"}</p>
      {side.images.length > 0 && (
        <div className="group mt-4 grid grid-cols-4 gap-1.5">
          {side.images.slice(0, 4).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" referrerPolicy="no-referrer" className="vision-img aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      )}
      <p className={`prose-area mt-4 whitespace-pre-wrap ${anti ? "text-[#dcd6d6]" : "text-ink"}`}>
        {side.text.trim() || <span className="text-faint italic">Todavía no has escrito esta parte.</span>}
      </p>
    </motion.section>
  );
}

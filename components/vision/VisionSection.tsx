"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { VisionKind } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/useAppStore";
import { AutosaveTextarea } from "../ui/AutosaveTextarea";
import { ArrowRightIcon, BookIcon, CompareIcon, PlusIcon } from "../ui/icons";
import { SectionTitle } from "../ui/SectionTitle";
import { VISION_COPY } from "./copy";
import { CompareView } from "./CompareView";
import { InspirationBoard } from "./InspirationBoard";
import { ReadingMode, type ReadingSection } from "./ReadingMode";
import { SlideCard } from "./SlideCard";
import { VisionLabel } from "./VisionLabel";

const filledImages = (urls: (string | null)[]) => urls.filter((u): u is string => !!u);

/** Shared by Portal and Antiportal — same structure, independent data, own theme. */
export function VisionSection({ kind }: { kind: VisionKind }) {
  const board = useAppStore((s) => s.visions[kind]);
  const updateVision = useAppStore((s) => s.updateVision);
  const addSlide = useAppStore((s) => s.addSlide);
  const copy = VISION_COPY[kind];
  const anti = kind === "antiportal";

  const [reading, setReading] = useState<ReadingSection[] | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const sections = useMemo(() => {
    const slides: ReadingSection[] = board.slides.map((s) => ({
      id: s.id,
      title: s.title,
      text: s.text,
      images: filledImages(s.images),
    }));
    return {
      beliefs: { id: "beliefs", title: copy.beliefsLabel, text: board.beliefs, images: [] } as ReadingSection,
      text: {
        id: "text",
        title: anti ? "Un día si sigo igual" : "Un día de mi vida soñada",
        text: board.text,
        images: filledImages(board.inspiration).slice(0, 4),
      },
      slides,
    };
  }, [board, copy, anti]);

  const readAll = () => setReading([sections.text, ...sections.slides, sections.beliefs]);
  const readOne = (id: string) => {
    const all = [sections.text, sections.beliefs, ...sections.slides];
    const found = all.find((s) => s.id === id);
    if (found) setReading([found]);
  };

  const handleAddSlide = () => {
    const slide = addSlide(kind);
    setTimeout(() => document.getElementById(`slide-${slide.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  return (
    <div className={anti ? "theme-antiportal" : ""}>
      {anti && <AntiportalAtmosphere />}

      <section className="relative">
        <SectionTitle
          color={anti ? "#a65a5a" : undefined}
          action={
            <Link
              href={copy.other.href}
              className={`chip !text-[11px] ${anti ? "hover:!border-mint/40 hover:!text-mint" : "hover:!border-[#c25454]/50 hover:!text-[#e07a7a]"}`}
            >
              {copy.other.label} <ArrowRightIcon size={12} />
            </Link>
          }
        >
          {copy.title}
        </SectionTitle>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative mt-4 overflow-hidden rounded-2xl border p-5 sm:p-7 ${
            anti
              ? "border-[#3d2121] bg-[radial-gradient(ellipse_at_top_left,#1a0d0d_0%,#0b0707_60%)]"
              : "border-mint/15 bg-[radial-gradient(ellipse_at_top_left,#0f1c19_0%,#0b0b0b_60%)]"
          }`}
        >
          {anti && <div className="grain pointer-events-none absolute inset-0" />}
          <h1
            className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${anti ? "text-[#d97b7b]" : "text-ink"}`}
            style={{ textShadow: anti ? "0 0 40px rgb(194 84 84 / 0.25)" : "0 0 40px rgb(94 234 212 / 0.2)" }}
          >
            {anti ? "Antiportal" : "Portal"}
            <span className="ml-2 align-middle text-sm font-semibold tracking-normal text-muted">dentro de 1 año</span>
          </h1>
          <p className="relative mt-2 max-w-2xl text-[15px] leading-relaxed text-soft">{copy.intro}</p>
          {anti && (
            <p className="relative mt-4 border-l-2 border-[#c25454]/60 pl-3 text-sm text-[#cfa3a3] italic">
              Uno no cambia hasta que el dolor de quedarse igual supera el dolor del cambio.
            </p>
          )}
          <div className="relative mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={readAll} className={`btn ${anti ? "bg-[#c25454] text-white hover:bg-[#d06262]" : "btn-light"}`}>
              <BookIcon size={15} /> Leer todo
            </button>
            <button type="button" onClick={() => setCompareOpen(true)} className="btn btn-ghost">
              <CompareIcon size={15} /> Portal vs Antiportal
            </button>
          </div>
        </motion.div>

        <div className="mt-10 space-y-12">
          <InspirationBoard kind={kind} hint={copy.boardHint} />

          <div>
            <BlockHeader label={copy.beliefsLabel} onRead={() => readOne("beliefs")} />
            <div className="mt-3 rounded-2xl border border-[var(--v-border)] bg-[var(--v-card)] px-4 pt-3 pb-8 sm:px-5">
              <AutosaveTextarea
                value={board.beliefs}
                onSave={(beliefs) => updateVision(kind, { beliefs })}
                placeholder={copy.beliefsPlaceholder}
                minRows={5}
                ariaLabel={copy.beliefsLabel}
                indicatorClassName="absolute -bottom-6 right-0"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <VisionLabel>Diapositivas</VisionLabel>
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5 hover:text-ink"
              >
                <CompareIcon size={14} /> Comparar
              </button>
            </div>
            <div className="mt-4 space-y-9">
              {board.slides.map((slide, i) => (
                <SlideCard key={slide.id} kind={kind} slide={slide} index={i} onRead={readOne} />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddSlide}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--v-border-strong)] py-4 text-sm text-muted transition hover:border-[var(--v-accent)]/50 hover:text-[var(--v-accent)]"
            >
              <PlusIcon size={15} /> Añadir slide
            </button>
          </div>

          <div>
            <BlockHeader label={copy.textLabel} onRead={() => readOne("text")} />
            <div className="mt-3 rounded-2xl border border-[var(--v-border)] bg-[var(--v-card)] px-4 pt-4 pb-8 shadow-[0_0_50px_var(--v-glow)] sm:px-6 sm:pt-5">
              <AutosaveTextarea
                value={board.text}
                onSave={(text) => updateVision(kind, { text })}
                placeholder={copy.textPlaceholder}
                minRows={10}
                ariaLabel={copy.textLabel}
                className="sm:!text-[18px]"
                indicatorClassName="absolute -bottom-6 right-0"
              />
            </div>
          </div>
        </div>
      </section>

      <ReadingMode kind={kind} sections={reading} onClose={() => setReading(null)} />
      <CompareView open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  );
}

function BlockHeader({ label, onRead }: { label: string; onRead: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <VisionLabel>{label}</VisionLabel>
      <button
        type="button"
        onClick={onRead}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-white/5 hover:text-ink"
      >
        <BookIcon size={14} /> Leer
      </button>
    </div>
  );
}

/** Dark red vignette + film grain over the whole page. */
function AntiportalAtmosphere() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgb(120 20 20 / 0.12), transparent 70%), radial-gradient(ellipse at center, transparent 45%, rgb(30 0 0 / 0.7) 100%)",
        }}
      />
      <div className="grain pointer-events-none fixed inset-0 -z-10" />
    </>
  );
}

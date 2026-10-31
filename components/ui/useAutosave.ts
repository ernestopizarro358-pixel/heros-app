"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved";

/**
 * Local draft + debounced save. External changes (e.g. a JSON import) are
 * picked up as long as there is no unsaved local edit.
 */
export function useAutosave(value: string, onSave: (text: string) => Promise<boolean>, delay = 700) {
  const [draft, setDraftState] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  useEffect(() => {
    if (pending.current === null) setDraftState(value);
  }, [value]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pending.current === null) return;
    const text = pending.current;
    pending.current = null;
    setStatus("saving");
    const ok = await saveRef.current(text);
    setStatus(ok ? "saved" : "idle");
  }, []);

  const setDraft = useCallback(
    (text: string) => {
      setDraftState(text);
      pending.current = text;
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delay);
    },
    [delay, flush],
  );

  // Never lose the last keystrokes when the component goes away.
  useEffect(() => () => void flush(), [flush]);

  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 2200);
    return () => clearTimeout(t);
  }, [status]);

  return { draft, setDraft, status, flush };
}

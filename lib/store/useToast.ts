"use client";

import { create } from "zustand";

export type ToastTone = "info" | "success" | "warning" | "error";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  show(message: string, tone?: ToastTone, durationMs?: number): void;
  dismiss(id: number): void;
}

let nextId = 1;

export const useToast = create<ToastState>()((set, get) => ({
  toasts: [],
  show(message, tone = "info", durationMs = 4200) {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-2), { id, message, tone }] });
    setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

/** Shortcut usable outside React components. */
export const toast = (message: string, tone?: ToastTone, durationMs?: number) =>
  useToast.getState().show(message, tone, durationMs);

"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal } from "./Modal";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm>(async () => false);

/** `const confirm = useConfirm(); if (await confirm({ title })) …` */
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback<Confirm>((next) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current(value);
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!options} onClose={() => close(false)} className="max-w-sm p-6" labelledBy="confirm-title">
        {options && (
          <>
            <h2 id="confirm-title" className="text-lg font-bold text-ink">
              {options.title}
            </h2>
            {options.message && <p className="mt-2 text-sm leading-relaxed text-muted">{options.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => close(false)}>
                {options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                autoFocus
                className={`btn ${options.danger ? "bg-crimson text-white hover:bg-rose-500" : "btn-light"}`}
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

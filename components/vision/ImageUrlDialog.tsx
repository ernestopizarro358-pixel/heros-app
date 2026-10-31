"use client";

import { useEffect, useState } from "react";
import { checkImageUrl } from "@/lib/images";
import { Modal } from "../ui/Modal";

interface Props {
  open: boolean;
  initialUrl: string | null;
  onClose: () => void;
  onSave: (url: string | null) => void;
}

export function ImageUrlDialog({ open, initialUrl, onClose, onSave }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialUrl ?? "");
    setPreview(initialUrl);
    setError(null);
  }, [open, initialUrl]);

  const submit = async (raw = value) => {
    setChecking(true);
    setError(null);
    const result = await checkImageUrl(raw);
    setChecking(false);
    if (!result.ok) {
      setError(result.message);
      setPreview(null);
      return;
    }
    onSave(result.url);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg p-5 sm:p-6" labelledBy="image-dialog-title">
      <p className="label">Imagen por URL</p>
      <h2 id="image-dialog-title" className="mt-1 text-lg font-bold">
        {initialUrl ? "Cambiar imagen" : "Añadir imagen"}
      </h2>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text/plain").trim();
            if (!text) return;
            e.preventDefault();
            setValue(text);
            void submit(text);
          }}
          placeholder="https://i.pinimg.com/…"
          aria-label="Dirección de la imagen"
          className="field font-mono !text-[13px]"
          inputMode="url"
        />

        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2.5 text-sm leading-relaxed text-gold-soft">
            {error}
          </p>
        )}

        {preview && !error && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" referrerPolicy="no-referrer" className="mt-4 max-h-56 w-full rounded-xl object-cover" />
        )}

        <div className="mt-4 rounded-xl border border-line bg-[#0b0b0b] p-3.5 text-[13px] leading-relaxed text-muted">
          <p className="font-semibold text-soft">Cómo copiarla desde Pinterest</p>
          <p className="mt-1">
            Abre el pin → clic derecho sobre la imagen → <span className="text-soft">«Copiar dirección de imagen»</span> (o
            «Abrir imagen en una pestaña nueva» y copia esa URL). Suele empezar por{" "}
            <span className="font-mono text-soft">https://i.pinimg.com/</span>.
          </p>
          <p className="mt-1.5">Truco: también puedes pasar el mouse sobre un hueco vacío y pulsar Ctrl+V.</p>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {initialUrl && (
            <button
              type="button"
              className="btn mr-auto text-rose-300/90 hover:bg-white/5"
              onClick={() => {
                onSave(null);
                onClose();
              }}
            >
              Quitar imagen
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-light" disabled={checking || !value.trim()}>
            {checking ? "Comprobando…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

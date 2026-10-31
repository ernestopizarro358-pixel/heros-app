/** Helpers for images added by URL (mostly from Pinterest). */

export type ImageCheck = { ok: true; url: string } | { ok: false; message: string };

export const PIN_LINK_MESSAGE =
  "Ese link es del pin, no de la imagen. Abre la imagen en una pestaña nueva y copia esa URL.";

const PIN_PAGE = /(^|\.)pinterest\.[a-z.]+\/pin\/|\/\/pin\.it\//i;

/** Quick synchronous checks before trying to load the image. */
export function precheckImageUrl(raw: string): ImageCheck {
  const url = raw.trim();
  if (!url) return { ok: false, message: "Pega la dirección de una imagen." };
  if (PIN_PAGE.test(url)) return { ok: false, message: PIN_LINK_MESSAGE };
  if (/^data:image\//i.test(url)) return { ok: true, url };
  if (!/^https?:\/\/\S+$/i.test(url)) {
    return { ok: false, message: "Eso no parece un link. Copia la dirección de la imagen (empieza por https://)." };
  }
  return { ok: true, url };
}

/** Verifies the URL actually loads as an image. */
export async function checkImageUrl(raw: string, timeoutMs = 9000): Promise<ImageCheck> {
  const pre = precheckImageUrl(raw);
  if (!pre.ok) return pre;
  const loaded = await new Promise<boolean>((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(false), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img.naturalWidth > 0);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.referrerPolicy = "no-referrer";
    img.src = pre.url;
  });
  if (loaded) return pre;
  const looksLikePinterestPage = /pinterest\./i.test(pre.url) && !/i\.pinimg\.com/i.test(pre.url);
  return {
    ok: false,
    message: looksLikePinterestPage
      ? PIN_LINK_MESSAGE
      : "Ese link no es una imagen (o no cargó). En Pinterest: clic derecho sobre la imagen → «Copiar dirección de imagen».",
  };
}

// ───────────── "Ctrl+V over a slot" support ─────────────

type PasteHandler = (text: string) => void;
let hovered: PasteHandler | null = null;
let listening = false;

/** Image slots register themselves while hovered so Ctrl+V lands on them. */
export function setHoveredPasteTarget(handler: PasteHandler | null) {
  hovered = handler;
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("paste", (event) => {
    if (!hovered) return;
    const active = document.activeElement;
    const typing =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLElement && active.isContentEditable);
    if (typing) return;
    const text = event.clipboardData?.getData("text/plain") ?? "";
    event.preventDefault();
    hovered(text);
  });
}

// ───────────── Board → PNG ─────────────

function loadForCanvas(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    const timer = setTimeout(() => resolve(null), 10000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundedClip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
}

/**
 * Renders the inspiration board as a PNG. Images whose server doesn't allow
 * cross-origin use can't be drawn: they're skipped and reported.
 */
export async function exportBoardPng(
  urls: (string | null)[],
  options: { title: string; filename: string; dark?: boolean },
): Promise<{ exported: number; skipped: number }> {
  const filled = urls.filter((u): u is string => !!u);
  const images = await Promise.all(filled.map(loadForCanvas));
  const exported = images.filter(Boolean).length;
  if (exported === 0) return { exported: 0, skipped: filled.length };

  const cols = 4;
  const rows = Math.ceil(urls.length / cols);
  const cell = { w: 300, h: 400 };
  const gap = 14;
  const pad = 36;
  const header = 70;
  const canvas = document.createElement("canvas");
  canvas.width = pad * 2 + cols * cell.w + (cols - 1) * gap;
  canvas.height = pad * 2 + header + rows * cell.h + (rows - 1) * gap;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = options.dark ? "#0b0808" : "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = options.dark ? "#a65a5a" : "#6fb8aa";
  ctx.font = "600 22px ui-monospace, monospace";
  ctx.fillText(options.title.toUpperCase().split("").join(" "), pad, pad + 26);

  let imageIndex = 0;
  urls.forEach((url, i) => {
    const x = pad + (i % cols) * (cell.w + gap);
    const y = pad + header + Math.floor(i / cols) * (cell.h + gap);
    ctx.save();
    roundedClip(ctx, x, y, cell.w, cell.h, 14);
    ctx.fillStyle = "#141414";
    ctx.fillRect(x, y, cell.w, cell.h);
    if (url) {
      const img = images[imageIndex++];
      if (img) {
        if (options.dark) ctx.filter = "grayscale(0.6) brightness(0.7)";
        drawCover(ctx, img, x, y, cell.w, cell.h);
        ctx.filter = "none";
      }
    }
    ctx.restore();
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return { exported: 0, skipped: filled.length };
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = options.filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 1500);
  return { exported, skipped: filled.length - exported };
}

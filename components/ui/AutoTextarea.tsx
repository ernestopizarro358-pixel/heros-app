"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type TextareaHTMLAttributes,
} from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number };

/**
 * Textarea that grows with its content — no inner scrollbar, ever.
 * Re-measures when the text or the available width changes.
 */
export const AutoTextarea = forwardRef<HTMLTextAreaElement, Props>(function AutoTextarea(
  { minRows = 3, className = "", style, ...props },
  ref,
) {
  const inner = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => inner.current as HTMLTextAreaElement);

  const resize = useCallback(() => {
    const el = inner.current;
    if (!el) return;
    // Collapsing to "auto" can shrink the page for a frame; keep the scroll put.
    const scrollY = window.scrollY;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
    if (window.scrollY !== scrollY) window.scrollTo({ top: scrollY });
  }, []);

  useLayoutEffect(resize, [props.value, resize]);

  useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        resize();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [resize]);

  return (
    <textarea
      ref={inner}
      rows={minRows}
      className={`block w-full resize-none overflow-hidden bg-transparent outline-none ${className}`}
      style={style}
      {...props}
    />
  );
});

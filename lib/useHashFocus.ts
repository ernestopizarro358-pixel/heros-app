"use client";

import { useEffect } from "react";

/**
 * When the URL has a hash (e.g. `/habitos#habit-123`, used by the links
 * between sections), scroll that element into view and flash it.
 */
export function useHashFocus(ready = true) {
  useEffect(() => {
    if (!ready) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("flash-highlight");
      setTimeout(() => el.classList.remove("flash-highlight"), 2200);
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }, 120);
    return () => clearTimeout(timer);
  }, [ready]);
}

"use client";

import { useEffect, useState } from "react";
import { todayKey } from "./date";
import type { DayKey } from "./data/types";

/** Today's key in America/La_Paz; updates itself when the day rolls over. */
export function useToday(): DayKey {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const check = () => setToday(todayKey());
    const interval = setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);
  return today;
}

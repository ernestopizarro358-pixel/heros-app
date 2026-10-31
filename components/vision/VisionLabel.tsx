import type { ReactNode } from "react";

/** "— TABLERO DE INSPIRACIÓN" label tinted with the vision theme. */
export function VisionLabel({ children, as: Tag = "h3" }: { children: ReactNode; as?: "h3" | "p" }) {
  return (
    <Tag className="label flex items-center gap-2.5 !text-[var(--v-label)]">
      <span className="h-px w-4 bg-current opacity-60" />
      {children}
    </Tag>
  );
}

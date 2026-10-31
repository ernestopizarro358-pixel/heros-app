import type { ReactNode } from "react";

/** "— PORTAL" style heading with a thin line on the left. */
export function SectionTitle({
  children,
  action,
  className = "",
  color,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="label flex items-center gap-3" style={color ? { color } : undefined}>
        <span className="h-px w-6 shrink-0 bg-current opacity-60" />
        {children}
      </h2>
      {action}
    </div>
  );
}

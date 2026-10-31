import Link from "next/link";
import type { ReactNode } from "react";

/** Small pill that links one section to another (input ↔ hábito ↔ jefe). */
export function LinkChip({
  href,
  icon,
  children,
  title,
  className = "",
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <Link href={href} title={title} className={`chip ${className}`}>
      <span aria-hidden>{icon}</span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

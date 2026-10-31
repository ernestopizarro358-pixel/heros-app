"use client";

import { AutoTextarea } from "./AutoTextarea";
import { SaveIndicator } from "./SaveIndicator";
import { useAutosave } from "./useAutosave";

interface Props {
  value: string;
  onSave: (text: string) => Promise<boolean>;
  placeholder?: string;
  minRows?: number;
  className?: string;
  ariaLabel?: string;
  /** Where the "Guardado ✓" indicator sits. */
  indicatorClassName?: string;
}

export function AutosaveTextarea({
  value,
  onSave,
  placeholder,
  minRows = 4,
  className = "",
  ariaLabel,
  indicatorClassName = "absolute right-3 bottom-2",
}: Props) {
  const { draft, setDraft, status, flush } = useAutosave(value, onSave);
  return (
    <div className="relative">
      <AutoTextarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void flush()}
        placeholder={placeholder}
        minRows={minRows}
        aria-label={ariaLabel}
        className={`prose-area placeholder:text-[#4d4d52] ${className}`}
      />
      <SaveIndicator status={status} className={indicatorClassName} />
    </div>
  );
}

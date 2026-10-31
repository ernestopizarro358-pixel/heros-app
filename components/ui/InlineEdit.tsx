"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  ariaLabel: string;
  /** Allow empty values (default: revert to previous). */
  allowEmpty?: boolean;
  maxLength?: number;
}

/** Text that turns into an input when clicked. Enter/blur saves, Esc cancels. */
export function InlineEdit({
  value,
  onSave,
  className = "",
  inputClassName = "",
  placeholder,
  ariaLabel,
  allowEmpty = false,
  maxLength = 200,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    const el = input.current;
    if (!editing || !el) return;
    el.focus();
    el.select();
  }, [editing]);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, editing]);

  const commit = () => {
    const next = draft.replace(/\s+/g, " ").trim();
    setEditing(false);
    if (!next && !allowEmpty) return setDraft(value);
    if (next !== value) onSave(next);
  };

  if (editing) {
    return (
      <textarea
        ref={input}
        rows={1}
        value={draft}
        maxLength={maxLength}
        aria-label={ariaLabel}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`w-full resize-none overflow-hidden rounded-md bg-white/5 px-1.5 py-0.5 outline-none ring-1 ring-white/15 ${className} ${inputClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Haz clic para editar"
      aria-label={`${ariaLabel}: ${value || placeholder || ""}`}
      className={`cursor-text text-left decoration-white/20 underline-offset-4 hover:underline ${className}`}
    >
      {value || <span className="opacity-40">{placeholder}</span>}
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

// Inline-editable title used for the project name and scene titles.
// Renders as text until focused; the underline appears on hover/focus.
export function EditableTitle({
  value,
  placeholder,
  onCommit,
  className = "",
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);

  return (
    <input
      ref={ref}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft.trim() || value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") ref.current?.blur();
      }}
      className={`w-full max-w-full truncate border-b border-transparent bg-transparent outline-none transition placeholder:text-[var(--color-muted-2)] hover:border-[var(--color-border)] focus:border-[var(--color-muted)] ${className}`}
    />
  );
}

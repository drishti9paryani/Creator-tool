"use client";

import * as Icons from "lucide-react";

// One story-idea suggestion: an icon + a one-line prompt. Clicking fills the
// textarea. Icon name comes from the data as a lucide-react key.
export function SuggestionChip({
  icon,
  text,
  onClick,
}: {
  icon: string;
  text: string;
  onClick: () => void;
}) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[icon] ?? Icons.Sparkles;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-3.5 text-left transition hover:border-[var(--color-border)] hover:bg-[var(--color-panel)]"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-panel-2)] text-[var(--color-muted)]">
        <Icon size={15} />
      </span>
      <span className="text-[13px] leading-snug text-[var(--color-text)]/90">{text}</span>
    </button>
  );
}

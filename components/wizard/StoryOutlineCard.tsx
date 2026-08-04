"use client";

import type { StoryOutline } from "@/lib/ai/types";

// A selectable story outline: title, description, Characters + Settings lists.
// Tall, internally scrollable card.
export function StoryOutlineCard({
  outline,
  selected,
  onSelect,
}: {
  outline: StoryOutline;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`scroll-thin flex h-[440px] w-full flex-col overflow-y-auto rounded-2xl border bg-[var(--color-panel)]/40 p-5 text-left transition ${
        selected
          ? "border-white/60 bg-[var(--color-panel)]"
          : "border-[var(--color-border-soft)] hover:border-[var(--color-border)]"
      }`}
    >
      <h3 className="text-[17px] font-bold">{outline.title}</h3>
      <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-muted)]">
        {outline.description}
      </p>

      <p className="mt-4 text-[13px] font-medium text-[var(--color-text)]">Characters:</p>
      <ul className="mt-1 space-y-1">
        {outline.characters.map((c, i) => (
          <li key={i} className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
            - {c}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[13px] font-medium text-[var(--color-text)]">Settings:</p>
      <ul className="mt-1 space-y-1">
        {outline.settings.map((s, i) => (
          <li key={i} className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">
            - {s}
          </li>
        ))}
      </ul>
    </button>
  );
}

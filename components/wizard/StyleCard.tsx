"use client";

import type { VisualStyle } from "@/lib/ai/types";

// A visual-style tile: thumbnail image + label. Selected = white ring.
export function StyleCard({
  style,
  selected,
  onSelect,
}: {
  style: VisualStyle;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button onClick={onSelect} className="group flex flex-col items-start">
      <div
        className={`h-[150px] w-[150px] overflow-hidden rounded-2xl border transition ${
          selected
            ? "border-white ring-2 ring-white"
            : "border-transparent group-hover:border-[var(--color-border)]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={style.thumbnail}
          alt={style.label}
          className="h-full w-full object-cover"
        />
      </div>
      <span
        className={`mt-2 text-[13px] ${
          selected ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-muted)]"
        }`}
      >
        {style.label}
      </span>
    </button>
  );
}

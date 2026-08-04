"use client";

import type { FormatOption } from "@/lib/ai/types";

// Selectable format card (YouTube Short 9:16 / YouTube Video 16:9) with a
// proportioned placeholder graphic in the center.
export function FormatCard({
  option,
  selected,
  onSelect,
}: {
  option: FormatOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const portrait = option.ratio === "9:16";
  return (
    <button
      onClick={onSelect}
      className={`group flex h-[210px] w-[290px] flex-col items-center justify-center rounded-2xl border bg-[var(--color-panel)]/40 transition ${
        selected
          ? "border-white/70 bg-[var(--color-panel)]"
          : "border-[var(--color-border-soft)] hover:border-[var(--color-border)]"
      }`}
    >
      <div className="flex flex-1 items-center justify-center">
        <div
          className={`rounded-md bg-[var(--color-panel-2)] ring-1 ring-white/10 ${
            portrait ? "h-[86px] w-[48px]" : "h-[48px] w-[86px]"
          }`}
        />
      </div>
      <div className="pb-6 text-center">
        <p className="text-[15px] font-semibold">{option.title}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{option.ratio}</p>
      </div>
    </button>
  );
}

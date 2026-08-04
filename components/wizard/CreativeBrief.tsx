import { Film, Palette } from "lucide-react";
import type { CreativeBrief as Brief } from "@/lib/ai/types";

// The creative-brief card shown on the final wizard step ("Review your creative
// brief") and reopened later from the TopBar "Creative Brief" button. Left:
// the story outline. Right: format + chosen visual style with its thumbnail.
export function CreativeBrief({ brief }: { brief: Brief }) {
  const formatLabel =
    brief.format === "short" ? "YouTube Short · 9:16" : "YouTube Video · 16:9";
  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-5 md:grid-cols-[1fr_260px]">
      {/* Left: story outline */}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
          Story outline
        </p>
        <h3 className="mt-1 text-lg font-bold">{brief.title}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]/90">
          {brief.summary}
        </p>

        {brief.characters.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold">Characters</p>
            <ul className="mt-1 space-y-1 text-sm text-[var(--color-muted)]">
              {brief.characters.map((c, i) => (
                <li key={i}>· {c}</li>
              ))}
            </ul>
          </div>
        )}

        {brief.settings.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold">Settings</p>
            <ul className="mt-1 space-y-1 text-sm text-[var(--color-muted)]">
              {brief.settings.map((s, i) => (
                <li key={i}>· {s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right: format + visual style */}
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-3">
          <p className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Film size={13} /> Format
          </p>
          <p className="mt-1 text-sm font-medium">{formatLabel}</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-3">
          <p className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Palette size={13} /> Visual style
          </p>
          <div className="mt-2 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brief.styleThumbnail}
              alt={brief.styleLabel}
              className="aspect-square w-full object-cover"
            />
          </div>
          <p className="mt-2 text-sm font-medium">{brief.styleLabel}</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { use, useState } from "react";
import { Play, Pause, Scissors, Download } from "lucide-react";
import { useStore } from "@/lib/store/project";
import { CommandBar } from "@/components/workspace/CommandBar";

// Editor (INFERRED) — only briefly shown in the source video via "Show in
// Editor". Built as a consistent simple timeline: a preview player above a
// horizontal track of scene/shot clips.
export default function Editor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const [playing, setPlaying] = useState(false);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
        Project not found.
      </div>
    );
  }

  const clips = project.scenes.flatMap((sc) =>
    sc.shots.length > 0
      ? sc.shots.map((sh) => ({ id: sh.id, label: sh.title, image: sh.image }))
      : [{ id: sc.id, label: sc.title, image: undefined as string | undefined }]
  );
  const firstImage = project.assets.find((a) => a.image)?.image;

  return (
    <>
      <div className="flex h-full flex-col px-8 py-6 pb-28">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Editor</h1>
          <button className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black hover:bg-white/90">
            <Download size={14} /> Export
          </button>
        </div>

        {/* Preview */}
        <div className="mt-5 flex flex-1 items-center justify-center">
          <div className="relative aspect-video w-full max-w-[880px] overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-black">
            {firstImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={firstImage} alt="" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                No footage yet
              </div>
            )}

            {/* Honest label: this is a storyboard still, not rendered footage —
                no video backend is wired in this build. */}
            <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white/80">
              Storyboard preview · video rendering unavailable
            </span>

            {/* Pressing play would imply playback we can't deliver; surface that
                instead of pretending. */}
            {playing && firstImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm text-white/90">
                Video preview unavailable in this build
              </div>
            )}

            <button
              onClick={() => setPlaying((p) => !p)}
              className="absolute bottom-4 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-white text-black"
              aria-label={playing ? "Stop preview" : "Play preview"}
            >
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Scissors size={13} /> Timeline
          </div>
          <div className="flex gap-2 overflow-x-auto scroll-thin pb-1">
            {clips.length === 0 && (
              <span className="py-6 text-sm text-[var(--color-muted)]">
                Add scenes and shots in Shot Builder to populate the timeline.
              </span>
            )}
            {clips.map((c) => (
              <div
                key={c.id}
                className="flex h-16 w-28 shrink-0 items-end overflow-hidden rounded-md border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-1.5"
                style={
                  c.image
                    ? {
                        backgroundImage: `url(${c.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CommandBar placeholder="Trim the intro and add a fade…" />
    </>
  );
}

"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  Scissors,
  Download,
  Film,
  SkipBack,
  Video,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store/project";
import { CommandBar } from "@/components/workspace/CommandBar";
import { downloadStoryboard } from "@/lib/export";
import { recordAnimaticVideo } from "@/lib/exportVideo";
import { ProjectLoading, ProjectMissing } from "@/components/workspace/ProjectGate";
import { useHydrated } from "@/lib/store/useHydrated";

const SECONDS_PER_CLIP = 2.5;

// Editor — a storyboard playthrough with Ken Burns motion and video export.
export default function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const pushToast = useStore((s) => s.pushToast);
  const dismissToast = useStore((s) => s.dismissToast);
  const [playing, setPlaying] = useState(false);
  const [kenBurns, setKenBurns] = useState(true);
  const [exportingVideo, setExportingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hydrated = useHydrated();

  const clips = useMemo(
    () =>
      project
        ? project.scenes.flatMap((sc) =>
            sc.shots.map((sh) => ({
              id: sh.id,
              label: sh.title,
              scene: sc.title,
              image: sh.image,
              screenplay: sh.screenplay,
            }))
          )
        : [],
    [project]
  );

  const withArt = clips.filter((c) => c.image).length;

  // Advance the playhead while playing; stop cleanly at the end.
  useEffect(() => {
    if (!playing || clips.length === 0) return;
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= clips.length) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, SECONDS_PER_CLIP * 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, clips.length]);

  // Keep the playhead valid if shots are deleted elsewhere.
  useEffect(() => {
    if (index >= clips.length) setIndex(Math.max(0, clips.length - 1));
  }, [clips.length, index]);

  // See ProjectGate: IndexedDB resolves asynchronously, so this order matters.
  if (!hydrated) return <ProjectLoading />;
  if (!project) return <ProjectMissing />;

  const current = clips[index];
  const totalSeconds = (clips.length * SECONDS_PER_CLIP).toFixed(1);

  async function handleExportVideo() {
    if (clips.length === 0) return;
    setExportingVideo(true);
    const toastId = pushToast({
      message: "Rendering Ken Burns Video Animatic…",
      variant: "loading",
    });

    try {
      const blob = await recordAnimaticVideo(clips, {
        secondsPerClip: SECONDS_PER_CLIP,
        aspect: project?.format === "short" ? "9:16" : "16:9",
        onProgress: (cur, tot) => {
          setVideoProgress(`${cur}/${tot}`);
        },
      });

      dismissToast(toastId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "animatic"}-animatic.webm`;
      a.click();
      URL.revokeObjectURL(url);

      pushToast({
        message: "Video animatic exported successfully!",
        detail: "Saved with smooth Ken Burns motion and dialogue overlays.",
        variant: "success",
      });
    } catch (err) {
      dismissToast(toastId);
      pushToast({
        message: "Failed to render video",
        detail: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setExportingVideo(false);
      setVideoProgress("");
    }
  }

  return (
    <>
      <div className="flex h-full flex-col px-5 py-6 pb-32 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">Editor</h1>
            <p className="text-xs text-[var(--color-muted)]">
              {clips.length} shot{clips.length === 1 ? "" : "s"} · {withArt} with
              frames · ~{totalSeconds}s animatic
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setKenBurns((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                kenBurns
                  ? "border-amber-500/50 bg-amber-950/30 text-amber-300"
                  : "border-[var(--color-border-soft)] bg-[var(--color-panel-2)] text-[var(--color-muted)]"
              }`}
            >
              <Sparkles size={13} />
              <span>Motion {kenBurns ? "ON" : "OFF"}</span>
            </button>

            <button
              onClick={handleExportVideo}
              disabled={exportingVideo || clips.length === 0}
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] px-3.5 py-1.5 text-xs text-[var(--color-text)] transition hover:bg-[#26262a] disabled:opacity-40"
            >
              <Video size={14} />
              <span>
                {exportingVideo
                  ? `Rendering ${videoProgress}…`
                  : "Export Video (.webm)"}
              </span>
            </button>

            <button
              onClick={() => {
                downloadStoryboard(project);
                pushToast({
                  message: "Storyboard exported",
                  detail:
                    "A single HTML file with every frame and screenplay — openable and shareable offline.",
                  variant: "success",
                });
              }}
              className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black hover:bg-white/90"
            >
              <Download size={14} /> Export HTML
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-5 flex flex-1 items-center justify-center">
          <div className="relative aspect-video w-full max-w-[880px] overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-black">
            {current?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${current.id}-${playing ? "play" : "pause"}`}
                src={current.image}
                alt={current.label}
                className={`h-full w-full object-contain transition-transform duration-[2500ms] ease-out ${
                  playing && kenBurns
                    ? index % 2 === 0
                      ? "scale-110"
                      : "scale-105 translate-x-2"
                    : "scale-100"
                }`}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <Film size={26} className="text-[var(--color-muted)]" />
                <p className="text-sm text-[var(--color-muted)]">
                  {clips.length === 0
                    ? "No shots yet"
                    : "This shot has no storyboard frame yet"}
                </p>
                <p className="text-xs text-[var(--color-muted-2)]">
                  Generate frames in Shot Builder to build the animatic.
                </p>
              </div>
            )}

            <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-[11px] text-white/80">
              {kenBurns ? "Ken Burns Motion Animatic" : "Storyboard Playthrough"}
            </span>

            {current && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-16 pt-8">
                <p className="text-[11px] uppercase tracking-wide text-white/50">
                  {current.scene}
                </p>
                <p className="truncate text-sm text-white/90">{current.label}</p>
                {current.screenplay && (
                  <p className="mt-1 line-clamp-2 max-w-[640px] text-xs italic text-white/70">
                    &ldquo;{current.screenplay}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Transport */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
              <button
                onClick={() => {
                  setIndex(0);
                  setPlaying(false);
                }}
                disabled={clips.length === 0}
                aria-label="Back to start"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:opacity-30"
              >
                <SkipBack size={15} />
              </button>
              <button
                onClick={() => {
                  if (index >= clips.length - 1) setIndex(0);
                  setPlaying((p) => !p);
                }}
                disabled={clips.length === 0}
                aria-label={playing ? "Pause" : "Play animatic"}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:opacity-30"
              >
                {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <Scissors size={13} /> Timeline
            <span className="ml-auto text-[var(--color-muted-2)]">
              {SECONDS_PER_CLIP}s per shot
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto scroll-thin pb-1">
            {clips.length === 0 && (
              <span className="py-6 text-sm text-[var(--color-muted)]">
                Add scenes and shots in Shot Builder to populate the timeline.
              </span>
            )}
            {clips.map((c, i) => (
              <button
                key={c.id}
                onClick={() => {
                  setIndex(i);
                  setPlaying(false);
                }}
                aria-label={`Jump to ${c.label}`}
                className={`flex h-16 w-28 shrink-0 items-end overflow-hidden rounded-md border p-1.5 text-left transition ${
                  i === index
                    ? "border-[var(--color-accent)]"
                    : "border-[var(--color-border-soft)] hover:border-[var(--color-muted-2)]"
                } bg-[var(--color-panel-2)]`}
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
                <span className="max-w-full truncate rounded bg-black/65 px-1.5 py-0.5 text-[10px] text-white">
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <CommandBar placeholder="Ask for a change — e.g. reorder the opening…" />
    </>
  );
}

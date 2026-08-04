"use client";

import { use, useState } from "react";
import {
  ChevronLeft,
  Plus,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { useStore } from "@/lib/store/project";
import { ai } from "@/lib/ai/client";
import { CommandBar } from "@/components/workspace/CommandBar";
import { EditableTitle } from "@/components/ui/EditableTitle";
import { Callout } from "@/components/ui/Tooltip";
import { Spinner } from "@/components/ui/Loader";
import type { Scene, Shot } from "@/lib/ai/types";

type Selection =
  | { kind: "none" }
  | { kind: "scene"; sceneId: string }
  | { kind: "shot"; sceneId: string; shotId: string };

export default function ShotBuilder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const {
    addScene,
    updateScene,
    deleteScene,
    addShot,
    updateShot,
    pushToast,
    dismissToast,
  } = useStore();

  const [sel, setSel] = useState<Selection>({ kind: "none" });
  const [collapsed, setCollapsed] = useState(false);
  const [showHint, setShowHint] = useState(true);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
        Project not found.
      </div>
    );
  }

  const scene =
    sel.kind !== "none"
      ? project.scenes.find((s) => s.id === sel.sceneId)
      : undefined;
  const shot =
    sel.kind === "shot" && scene
      ? scene.shots.find((sh) => sh.id === sel.shotId)
      : undefined;

  async function generateVideo(target: { sceneId?: string; shotId?: string }) {
    const t = pushToast({ message: "Generating video…", variant: "loading" });
    const { url } = await ai.generateVideo(target);
    dismissToast(t);
    // No cheap text-to-video backend is wired, so generateVideo returns no url.
    // Be honest rather than claim a video was produced.
    pushToast(
      url
        ? { message: "Video generated", variant: "success" }
        : { message: "Video preview unavailable — video generation isn't wired in this build" }
    );
  }

  async function regenStoryboard(sceneId: string, shotId: string) {
    updateShot(id, sceneId, shotId, { status: "generating" });
    const r = await ai.generateShotStoryboard(shotId);
    updateShot(id, sceneId, shotId, { status: "ready", image: r.image });
  }

  return (
    <>
      <div className="flex h-full">
        {/* Storyline mini-panel */}
        {!collapsed ? (
          <aside className="w-[260px] shrink-0 border-r border-[var(--color-border-soft)] px-4 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Storyline</h2>
              <button
                onClick={() => setCollapsed(true)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {project.scenes.map((sc) => (
                <SceneItem
                  key={sc.id}
                  scene={sc}
                  selectedShotId={sel.kind === "shot" ? sel.shotId : undefined}
                  sceneSelected={sel.kind === "scene" && sel.sceneId === sc.id}
                  onSelectScene={() => setSel({ kind: "scene", sceneId: sc.id })}
                  onSelectShot={(shotId) =>
                    setSel({ kind: "shot", sceneId: sc.id, shotId })
                  }
                  onAddShot={() => addShot(id, sc.id)}
                  onGenerateVideos={() => generateVideo({ sceneId: sc.id })}
                />
              ))}
            </div>

            <button
              onClick={() => addScene(id)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-soft)] py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <ImageIcon size={14} /> Add scene
            </button>
          </aside>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="h-full w-8 border-r border-[var(--color-border-soft)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            ›
          </button>
        )}

        {/* Detail panel */}
        <div className="relative flex-1 overflow-y-auto scroll-thin px-10 py-6 pb-28">
          {sel.kind === "none" && (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
              Select a shot or scene to view details
            </div>
          )}

          {sel.kind === "scene" && scene && (
            <div className="mx-auto max-w-[820px]">
              <div className="flex items-start justify-between">
                <EditableTitle
                  value={scene.title}
                  placeholder="Scene Title"
                  onCommit={(v) => updateScene(id, scene.id, { title: v })}
                  className="text-2xl font-bold text-[var(--color-muted)]"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => generateVideo({ sceneId: scene.id })}
                    className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black hover:bg-white/90"
                  >
                    <Sparkles size={14} /> Generate all videos
                  </button>
                  <button
                    onClick={() => {
                      deleteScene(id, scene.id);
                      setSel({ kind: "none" });
                    }}
                    className="text-[var(--color-muted)] hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <textarea
                value={scene.description}
                onChange={(e) => updateScene(id, scene.id, { description: e.target.value })}
                placeholder="Enter scene description…"
                className="scroll-thin mt-5 h-28 w-full resize-none rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-4 text-sm outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-border)]"
              />
            </div>
          )}

          {sel.kind === "shot" && scene && shot && (
            <div className="mx-auto max-w-[820px]">
              <div className="flex items-start justify-between">
                <EditableTitle
                  value={shot.title}
                  placeholder="Unnamed Shot"
                  onCommit={(v) => updateShot(id, scene.id, shot.id, { title: v })}
                  className="text-2xl font-bold"
                />
                <div className="relative flex items-center gap-3">
                  <button
                    onClick={() => regenStoryboard(scene.id, shot.id)}
                    className="flex items-center gap-2 rounded-full bg-[var(--color-panel-2)] px-3.5 py-1.5 text-sm hover:bg-[#26262a]"
                  >
                    <ImageIcon size={14} /> Regenerate Storyboard
                  </button>
                  <button
                    onClick={() => generateVideo({ shotId: shot.id })}
                    className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black hover:bg-white/90"
                  >
                    <Sparkles size={14} /> Generate Video
                  </button>
                  {showHint && (
                    <div className="absolute right-0 top-11 z-20">
                      <Callout
                        title="You're almost there!"
                        body="Click here to generate your video from the start frame."
                        onDismiss={() => setShowHint(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
                {/* Storyboard preview */}
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)]">
                  {shot.status === "generating" ? (
                    <Spinner />
                  ) : shot.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shot.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Film size={26} className="text-[var(--color-muted)]" />
                  )}
                  <button className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                    <Sparkles size={12} /> Edit with prompt
                  </button>
                </div>

                {/* Right column: Assets + Screenplay */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                        Assets
                      </span>
                      <button className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {project.assets.slice(0, 3).map((a) => (
                        <span
                          key={a.id}
                          className="h-10 w-10 overflow-hidden rounded-md bg-[var(--color-panel-2)]"
                        >
                          {a.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.image} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                      Screenplay
                    </span>
                    <textarea
                      value={shot.screenplay ?? ""}
                      onChange={(e) =>
                        updateShot(id, scene.id, shot.id, { screenplay: e.target.value })
                      }
                      placeholder="Describe the action…"
                      className="scroll-thin mt-2 h-24 w-full resize-none rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-3 text-sm outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-border)]"
                    />
                    <button className="mt-2 flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]">
                      <Plus size={12} /> Add Cut
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <CommandBar placeholder="Make this a wide-angle shot…" />
    </>
  );
}

function SceneItem({
  scene,
  sceneSelected,
  selectedShotId,
  onSelectScene,
  onSelectShot,
  onAddShot,
  onGenerateVideos,
}: {
  scene: Scene;
  sceneSelected: boolean;
  selectedShotId?: string;
  onSelectScene: () => void;
  onSelectShot: (shotId: string) => void;
  onAddShot: () => void;
  onGenerateVideos: () => void;
}) {
  return (
    <div className="rounded-lg">
      <button
        onClick={onSelectScene}
        className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
          sceneSelected
            ? "bg-[var(--color-panel)] text-[var(--color-text)]"
            : "text-[var(--color-text)] hover:bg-white/5"
        }`}
      >
        {scene.title}
      </button>

      <div className="mt-1 space-y-1 pl-1">
        {scene.shots.map((sh: Shot) => (
          <button
            key={sh.id}
            onClick={() => onSelectShot(sh.id)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
              selectedShotId === sh.id
                ? "bg-[var(--color-panel)]"
                : "hover:bg-white/5"
            }`}
          >
            <span className="flex h-6 w-8 items-center justify-center rounded bg-[var(--color-panel-2)]">
              <ImageIcon size={12} className="text-[var(--color-muted)]" />
            </span>
            {sh.title}
          </button>
        ))}
      </div>

      <div className="mt-1 flex gap-2 pl-1">
        <button
          onClick={onAddShot}
          className="flex-1 rounded-md border border-[var(--color-border-soft)] py-1.5 text-[11px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          Add Shots
        </button>
        {scene.shots.length > 0 && (
          <button
            onClick={onGenerateVideos}
            className="flex items-center gap-1 rounded-md border border-[var(--color-border-soft)] px-2 py-1.5 text-[11px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <Sparkles size={11} /> Generate Videos
          </button>
        )}
      </div>
    </div>
  );
}

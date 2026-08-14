"use client";

import { use, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  Film,
  Wand2,
  PenLine,
} from "lucide-react";
import { useStore } from "@/lib/store/project";
import { ai } from "@/lib/ai/client";
import { CommandBar } from "@/components/workspace/CommandBar";
import { EditableTitle } from "@/components/ui/EditableTitle";
import { Callout } from "@/components/ui/Tooltip";
import { Spinner } from "@/components/ui/Loader";
import { ProjectLoading, ProjectMissing } from "@/components/workspace/ProjectGate";
import { useHydrated } from "@/lib/store/useHydrated";
import type { Project, Scene, Shot } from "@/lib/ai/types";

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
    deleteShot,
    pushToast,
    dismissToast,
  } = useStore();

  const [sel, setSel] = useState<Selection>({ kind: "none" });
  const [collapsed, setCollapsed] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [writing, setWriting] = useState(false);
  const hydrated = useHydrated();

  // The store loads from IndexedDB asynchronously — "no project" is meaningless
  // until hydration finishes, and showing the missing-project screen first
  // tells a tester their work is gone.
  if (!hydrated) return <ProjectLoading />;
  if (!project) return <ProjectMissing />;

  const scene =
    sel.kind !== "none" ? project.scenes.find((s) => s.id === sel.sceneId) : undefined;
  const shot =
    sel.kind === "shot" && scene ? scene.shots.find((sh) => sh.id === sel.shotId) : undefined;

  async function generateVideo(target: { sceneId?: string; shotId?: string }) {
    const t = pushToast({ message: "Generating video…", variant: "loading" });
    try {
      const { url } = await ai.generateVideo(target);
      dismissToast(t);
      pushToast(
        url
          ? { message: "Video generated", variant: "success" }
          : {
              message: "Video rendering isn't part of this prototype",
              detail:
                "Storyboard frames are real. Motion is out of scope — see the Editor for a storyboard playthrough.",
              variant: "warning",
            }
      );
    } catch (e) {
      dismissToast(t);
      pushToast({
        message: "Video request failed",
        detail: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  }

  /**
   * Regenerate a storyboard frame. Everything the image model needs now travels
   * with the request — scene, screenplay, cast. The previous build sent only
   * the shot id, so the prompt literally read "storyboard frame for shot
   * scene-1-shot-2" and the result could not reflect the story.
   */
  async function regenStoryboard(
    sceneId: string,
    shotId: string,
    extraPrompt?: string
  ) {
    const sc = project!.scenes.find((s) => s.id === sceneId);
    const sh = sc?.shots.find((x) => x.id === shotId);
    if (!sc || !sh) return;

    updateShot(id, sceneId, shotId, { status: "generating" });
    try {
      const r = await ai.generateShotStoryboard({
        shotId,
        projectId: id,
        shotTitle: sh.title,
        screenplay: [sh.screenplay, extraPrompt].filter(Boolean).join(" "),
        sceneTitle: sc.title,
        sceneDescription: sc.description,
        castNotes: project!.assets
          .filter((a) => a.type !== "prop")
          .slice(0, 3)
          .map((a) => `${a.name}: ${a.description ?? ""}`),
        styleId: project!.styleId,
        format: project!.format,
      });
      updateShot(id, sceneId, shotId, { status: "ready", image: r.image });
    } catch (e) {
      updateShot(id, sceneId, shotId, { status: "empty" });
      pushToast({
        message: "Couldn't generate that storyboard frame",
        detail: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  }

  async function writeScreenplay(sceneId: string, shotId: string) {
    const sc = project!.scenes.find((s) => s.id === sceneId);
    const sh = sc?.shots.find((x) => x.id === shotId);
    if (!sc || !sh) return;

    setWriting(true);
    try {
      const r = await ai.generateScreenplay({
        shotTitle: sh.title,
        sceneTitle: sc.title,
        sceneDescription: sc.description,
        storySummary: project!.brief?.summary ?? "",
        format: project!.format,
      });
      updateShot(id, sceneId, shotId, { screenplay: r.text });
    } catch (e) {
      pushToast({
        message: "Couldn't write that screenplay",
        detail: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setWriting(false);
    }
  }

  return (
    <>
      <div className="flex h-full">
        {/* Storyline panel */}
        {!collapsed ? (
          <aside className="w-[240px] shrink-0 overflow-y-auto scroll-thin border-r border-[var(--color-border-soft)] px-4 py-5 sm:w-[260px]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Storyline</h2>
              <button
                onClick={() => setCollapsed(true)}
                aria-label="Collapse storyline"
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {project.scenes.length === 0 && (
              <p className="mt-4 text-xs leading-relaxed text-[var(--color-muted)]">
                No scenes yet. Add one below to start building your shot list.
              </p>
            )}

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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-soft)] py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <Plus size={14} /> Add scene
            </button>
          </aside>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand storyline"
            className="flex h-full w-9 items-center justify-center border-r border-[var(--color-border-soft)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Detail panel */}
        <div className="relative flex-1 overflow-y-auto scroll-thin px-5 py-6 pb-32 sm:px-10">
          {sel.kind === "none" && <EmptySelection project={project} />}

          {sel.kind === "scene" && scene && (
            <div className="mx-auto max-w-[820px]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <EditableTitle
                  value={scene.title}
                  placeholder="Scene Title"
                  onCommit={(v) => updateScene(id, scene.id, { title: v })}
                  className="text-2xl font-bold"
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
                    aria-label="Delete scene"
                    className="text-[var(--color-muted)] hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <label className="mt-5 block text-xs uppercase tracking-wide text-[var(--color-muted)]">
                Scene description
              </label>
              <textarea
                value={scene.description}
                onChange={(e) =>
                  updateScene(id, scene.id, { description: e.target.value })
                }
                placeholder="What happens in this scene…"
                className="scroll-thin mt-2 h-28 w-full resize-none rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-4 text-sm outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
              />

              <p className="mt-3 text-xs text-[var(--color-muted-2)]">
                {scene.shots.length} shot{scene.shots.length === 1 ? "" : "s"} in this
                scene. This description is sent with every storyboard frame you
                generate here.
              </p>
            </div>
          )}

          {sel.kind === "shot" && scene && shot && (
            <div className="mx-auto max-w-[880px]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                    {scene.title}
                  </p>
                  <EditableTitle
                    value={shot.title}
                    placeholder="Unnamed Shot"
                    onCommit={(v) => updateShot(id, scene.id, shot.id, { title: v })}
                    className="text-2xl font-bold"
                  />
                </div>
                <div className="relative flex items-center gap-3">
                  <button
                    onClick={() => regenStoryboard(scene.id, shot.id)}
                    disabled={shot.status === "generating"}
                    className="flex items-center gap-2 rounded-full bg-[var(--color-panel-2)] px-3.5 py-1.5 text-sm transition hover:bg-[#26262a] disabled:opacity-50"
                  >
                    <ImageIcon size={14} />
                    {shot.image ? "Regenerate" : "Generate"} storyboard
                  </button>
                  <button
                    onClick={() => generateVideo({ shotId: shot.id })}
                    className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black hover:bg-white/90"
                  >
                    <Sparkles size={14} /> Generate Video
                  </button>
                  <button
                    onClick={() => {
                      deleteShot(id, scene.id, shot.id);
                      setSel({ kind: "scene", sceneId: scene.id });
                    }}
                    aria-label="Delete shot"
                    className="text-[var(--color-muted)] hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                  {showHint && (
                    <div className="absolute right-0 top-11 z-20">
                      <Callout
                        title="You're almost there!"
                        body="Generate the storyboard frame first — the screenplay below is what it draws from."
                        onDismiss={() => setShowHint(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
                {/* Storyboard preview */}
                <div>
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)]">
                    {shot.status === "generating" ? (
                      <div className="flex flex-col items-center gap-3">
                        <Spinner size={24} />
                        <span className="text-xs text-[var(--color-muted)]">
                          Drawing this frame…
                        </span>
                      </div>
                    ) : shot.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={shot.image}
                        alt={shot.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-6 text-center">
                        <Film size={24} className="text-[var(--color-muted)]" />
                        <p className="text-sm text-[var(--color-muted)]">
                          No storyboard frame yet
                        </p>
                        <p className="text-xs text-[var(--color-muted-2)]">
                          Write the screenplay, then generate the frame.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* "Edit with prompt" — now an actual control rather than a
                      decorative overlay button. */}
                  <PromptEditRow
                    disabled={shot.status === "generating"}
                    onApply={(p) => regenStoryboard(scene.id, shot.id, p)}
                  />
                </div>

                {/* Right column: Assets + Screenplay */}
                <div className="space-y-6">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                      In this shot
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {project.assets.filter((a) => a.type !== "prop").length === 0 && (
                        <p className="text-xs text-[var(--color-muted-2)]">
                          No cast yet — add characters on the Assets page.
                        </p>
                      )}
                      {project.assets
                        .filter((a) => a.type !== "prop")
                        .slice(0, 4)
                        .map((a) => (
                          <div key={a.id} className="flex items-center gap-2">
                            <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-[var(--color-panel-2)]">
                              {a.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={a.image}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </span>
                            <span className="truncate text-xs text-[var(--color-muted)]">
                              {a.name}
                            </span>
                          </div>
                        ))}
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--color-muted-2)]">
                      Your cast is sent with every frame to keep designs consistent.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                        Screenplay
                      </span>
                      <button
                        onClick={() => writeScreenplay(scene.id, shot.id)}
                        disabled={writing}
                        className="flex items-center gap-1 text-xs text-[var(--color-muted)] transition hover:text-[var(--color-text)] disabled:opacity-50"
                      >
                        <PenLine size={12} /> {writing ? "Writing…" : "Write for me"}
                      </button>
                    </div>
                    <textarea
                      value={shot.screenplay ?? ""}
                      onChange={(e) =>
                        updateShot(id, scene.id, shot.id, { screenplay: e.target.value })
                      }
                      placeholder="Describe the action…"
                      className="scroll-thin mt-2 h-40 w-full resize-none rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-3 text-sm leading-relaxed outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CommandBar
        placeholder={
          sel.kind === "shot"
            ? "Change this shot — e.g. make it a wide angle at dusk…"
            : "Ask for a change…"
        }
        submitLabel={
          sel.kind === "shot"
            ? "Regenerates the selected storyboard frame"
            : undefined
        }
        onSubmit={
          sel.kind === "shot"
            ? (p) => regenStoryboard(sel.sceneId, sel.shotId, p)
            : undefined
        }
      />
    </>
  );
}

// Inline prompt row under the storyboard preview.
function PromptEditRow({
  disabled,
  onApply,
}: {
  disabled?: boolean;
  onApply: (prompt: string) => void;
}) {
  const [value, setValue] = useState("");
  const apply = () => {
    if (!value.trim()) return;
    onApply(value.trim());
    setValue("");
  };
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && apply()}
        placeholder="Edit with a prompt — e.g. shoot from below, harsher light"
        className="flex-1 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-2.5 text-sm outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
      />
      <button
        onClick={apply}
        disabled={disabled || !value.trim()}
        className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-panel-2)] px-4 py-2.5 text-sm transition hover:bg-[#26262a] disabled:opacity-40"
      >
        <Wand2 size={14} /> Apply
      </button>
    </div>
  );
}

function EmptySelection({ project }: { project: Project }) {
  const shotCount = project.scenes.reduce((n, s) => n + s.shots.length, 0);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <Film size={26} className="text-[var(--color-muted-2)]" />
      <p className="text-sm text-[var(--color-muted)]">
        Select a scene or shot on the left to start building.
      </p>
      <p className="max-w-[380px] text-xs text-[var(--color-muted-2)]">
        {project.scenes.length} scene{project.scenes.length === 1 ? "" : "s"} ·{" "}
        {shotCount} shot{shotCount === 1 ? "" : "s"} were drafted from your story.
        Every one is editable.
      </p>
    </div>
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
              selectedShotId === sh.id ? "bg-[var(--color-panel)]" : "hover:bg-white/5"
            }`}
          >
            <span className="flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--color-panel-2)]">
              {sh.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sh.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={12} className="text-[var(--color-muted)]" />
              )}
            </span>
            <span className="truncate">{sh.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-1 flex gap-2 pl-1">
        <button
          onClick={onAddShot}
          className="flex-1 rounded-md border border-[var(--color-border-soft)] py-1.5 text-[11px] text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          Add shot
        </button>
        {scene.shots.length > 0 && (
          <button
            onClick={onGenerateVideos}
            className="flex items-center gap-1 rounded-md border border-[var(--color-border-soft)] px-2 py-1.5 text-[11px] text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            <Sparkles size={11} /> Videos
          </button>
        )}
      </div>
    </div>
  );
}

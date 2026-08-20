"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Film, Trash2, Sparkles, Info, X, Users } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store/project";
import { useHydrated } from "@/lib/store/useHydrated";
import { STYLES } from "@/data/styles";

const SEEN_INTRO_KEY = "prototype-studio:intro-dismissed";

export function ProjectsHome({ liveMode }: { liveMode: boolean }) {
  const router = useRouter();
  const projects = useStore((s) => s.projects);
  const resetDraft = useStore((s) => s.resetDraft);
  const deleteProject = useStore((s) => s.deleteProject);

  // Projects live in IndexedDB, so the first client render has none. A mount
  // effect fires BEFORE that async read resolves, so gating on mount showed a
  // returning tester "Start your first project" — all their work apparently
  // gone — before it popped back in. Gate on real store hydration instead.
  const hydrated = useHydrated();
  const [showIntro, setShowIntro] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setShowIntro(localStorage.getItem(SEEN_INTRO_KEY) !== "1");
  }, []);

  const dismissIntro = () => {
    localStorage.setItem(SEEN_INTRO_KEY, "1");
    setShowIntro(false);
  };

  const startNew = () => {
    resetDraft();
    router.push("/create");
  };

  return (
    <div className="bg-glow-soft min-h-screen">
      <header className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <span
            title={
              liveMode
                ? "Connected to live AI models"
                : "Running on the built-in story engine — no API keys, no cost"
            }
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] sm:flex ${
              liveMode
                ? "border-emerald-500/40 text-emerald-300"
                : "border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                liveMode ? "bg-emerald-400" : "bg-[var(--color-muted)]"
              }`}
            />
            {liveMode ? "Live AI" : "Demo mode"}
          </span>
          <Link
            href="/characters"
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] px-3.5 py-1.5 text-xs text-[var(--color-text)] transition hover:bg-[#26262a]"
          >
            <Users size={14} /> Character Bible
          </Link>
          <Button variant="white" onClick={startNew}>
            <Plus size={15} /> New project
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 sm:py-10">
        {/* First-run orientation. Testers arrive with no idea what this is or
            where the edges are — saying so upfront produces better feedback
            than letting them discover the boundaries as apparent bugs. */}
        {showIntro && (
          <div className="animate-fade-up relative mb-9 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)]/60 p-5 sm:p-6">
            <button
              onClick={dismissIntro}
              aria-label="Dismiss introduction"
              className="absolute right-4 top-4 text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2">
              <Info size={16} className="text-[var(--color-accent)]" />
              <h2 className="font-bold">Welcome — here&apos;s what this prototype does</h2>
            </div>
            <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-[var(--color-muted)]">
              Type a story idea and it becomes a production package: three story
              options, a cast of characters and locations with generated art, a
              scene-by-scene shot list with screenplay, and a storyboard you can
              play back and export.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)]/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                  Works end to end
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Story generation, cast &amp; locations, shot lists, screenplays,
                  storyboard frames, animatic playback, HTML export.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)]/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Not in this build
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Rendered video, voice-over, accounts and sharing. Your work is
                  saved in this browser only.
                </p>
              </div>
            </div>
            <button
              onClick={dismissIntro}
              className="mt-4 text-sm text-[var(--color-muted)] underline underline-offset-4 hover:text-[var(--color-text)]"
            >
              Got it
            </button>
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your projects</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Create and manage your AI-generated videos.
            </p>
          </div>
          {hydrated && projects.length > 0 && (
            <span className="text-sm text-[var(--color-muted-2)]">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {!hydrated ? (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[190px] animate-pulse rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/30"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <button
            onClick={startNew}
            className="mt-8 flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <Sparkles size={28} />
            <span className="mt-3 text-sm font-medium">Start your first project</span>
            <span className="mt-1 max-w-[380px] px-6 text-center text-xs text-[var(--color-muted-2)]">
              Takes about a minute — you&apos;ll pick a format, describe an idea, and
              choose a look.
            </span>
          </button>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((p) => {
              const thumb =
                p.assets.find((a) => a.image)?.image ??
                STYLES.find((s) => s.id === p.styleId)?.thumbnail;
              const shots = p.scenes.reduce((n, s) => n + s.shots.length, 0);
              return (
                <div key={p.id} className="group relative">
                  <Link
                    href={`/project/${p.id}/assets`}
                    className="block overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 transition hover:border-[var(--color-border)]"
                  >
                    <div className="flex aspect-video items-center justify-center bg-[var(--color-panel-2)]">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Film size={22} className="text-[var(--color-muted)]" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {p.format === "short" ? "Short · 9:16" : "Video · 16:9"} ·{" "}
                        {p.assets.length} assets · {shots} shots
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => setConfirmDelete(p.id)}
                    aria-label={`Delete ${p.title}`}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white/70 opacity-0 transition hover:text-white focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}

            <button
              onClick={startNew}
              className="flex min-h-[190px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <Plus size={24} />
              <span className="mt-2 text-xs">New project</span>
            </button>
          </div>
        )}
      </main>

      {/* Deleting is permanent and there is no server copy — confirm it. */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6"
          >
            <h2 className="text-lg font-bold">Delete this project?</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              This removes it from this browser permanently. There&apos;s no server
              copy and no undo.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="solid"
                onClick={() => {
                  deleteProject(confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

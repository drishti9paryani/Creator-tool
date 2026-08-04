"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Film } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store/project";
import { STYLES } from "@/data/styles";

// Home / projects dashboard. (Inferred — the recording starts mid-wizard; the
// sidebar's "Home" entry implies a projects landing.)
export default function Home() {
  const router = useRouter();
  const projects = useStore((s) => s.projects);
  const resetDraft = useStore((s) => s.resetDraft);

  const startNew = () => {
    resetDraft();
    router.push("/create");
  };

  return (
    <div className="bg-glow-soft min-h-screen">
      <header className="flex items-center justify-between px-8 py-5">
        <Logo />
        <Button variant="white" onClick={startNew}>
          <Plus size={15} /> New project
        </Button>
      </header>

      <main className="mx-auto max-w-[1100px] px-8 py-10">
        <h1 className="text-2xl font-bold">Your projects</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Create and manage your AI-generated videos.
        </p>

        {projects.length === 0 ? (
          <button
            onClick={startNew}
            className="mt-8 flex h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <Plus size={28} />
            <span className="mt-3 text-sm">Start your first project</span>
          </button>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((p) => {
              const thumb =
                p.assets.find((a) => a.image)?.image ??
                STYLES.find((s) => s.id === p.styleId)?.thumbnail;
              return (
                <Link
                  key={p.id}
                  href={`/project/${p.id}/assets`}
                  className="group overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 transition hover:border-[var(--color-border)]"
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
                      {p.format === "short" ? "YouTube Short · 9:16" : "YouTube Video · 16:9"}
                    </p>
                  </div>
                </Link>
              );
            })}

            <button
              onClick={startNew}
              className="flex aspect-[4/3.4] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <Plus size={24} />
              <span className="mt-2 text-xs">New project</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

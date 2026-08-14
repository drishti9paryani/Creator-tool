"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, X, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { CreativeBrief } from "@/components/wizard/CreativeBrief";
import { useStore } from "@/lib/store/project";

// Top workspace bar: back to projects, project title, and the Creative Brief.
//
// Removed: a hamburger that opened nothing, a settings slider that opened
// nothing, a bell that opened nothing, a duplicate library icon, and a fake
// user avatar. Five controls, zero behaviour — every one of them an invitation
// to file a bug during testing.
export function TopBar({ projectId }: { projectId: string }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const [briefOpen, setBriefOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBriefOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border-soft)] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          aria-label="Back to projects"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={17} />
        </Link>
        <Logo label={project?.title ?? "PROTOTYPE"} />
      </div>

      <button
        onClick={() => setBriefOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-panel-2)] px-3.5 py-1.5 text-sm text-[var(--color-text)] transition hover:bg-[#26262a]"
      >
        <BookOpen size={14} />
        <span className="hidden sm:inline">Creative Brief</span>
      </button>

      {/* Creative Brief modal — reopens the wizard's final brief. */}
      {briefOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setBriefOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Creative Brief"
            className="relative mt-8 w-full max-w-[860px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Creative Brief</h2>
              <button
                onClick={() => setBriefOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-panel-2)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X size={16} />
              </button>
            </div>
            {project?.brief ? (
              <CreativeBrief brief={project.brief} />
            ) : (
              <p className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-6 text-sm text-[var(--color-muted)]">
                No creative brief for this project yet.
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

"use client";

import { useState } from "react";
import { Menu, Bell, BookOpen, SlidersHorizontal, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EditableTitle } from "@/components/ui/EditableTitle";
import { CreativeBrief } from "@/components/wizard/CreativeBrief";
import { useStore } from "@/lib/store/project";

// Top workspace bar: hamburger, red logo + editable project title, and the
// right-side actions (settings, Creative Brief, notifications, library, avatar).
export function TopBar({ projectId }: { projectId: string }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const updateTitle = useStore((s) => s.updateProjectTitle);
  const [briefOpen, setBriefOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-4">
        <button className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
          <Menu size={18} />
        </button>
        <Logo label={project?.title ?? "PROTOTYPE"} />
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-panel)] text-[var(--color-muted)] hover:text-[var(--color-text)]">
          <SlidersHorizontal size={15} />
        </button>
        <button
          onClick={() => setBriefOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--color-panel-2)] px-3.5 py-1.5 text-sm text-[var(--color-text)] hover:bg-[#26262a]"
        >
          <BookOpen size={14} /> Creative Brief
        </button>
        <button className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
          <Bell size={17} />
        </button>
        <button className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
          <BookOpen size={17} />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">
          m
        </div>
      </div>

      {/* Editable project title lives under the logo wordmark on the init view;
          on populated views the title shows in the logo slot above. Kept here as
          a hidden a11y anchor for title edits triggered elsewhere. */}
      {project && (
        <span className="sr-only">
          <EditableTitle
            value={project.title}
            placeholder="Title of the project"
            onCommit={(v) => updateTitle(projectId, v)}
          />
        </span>
      )}

      {/* Creative Brief modal — reopens the wizard's final brief. */}
      {briefOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setBriefOpen(false)}
        >
          <div
            className="relative mt-10 w-full max-w-[860px]"
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

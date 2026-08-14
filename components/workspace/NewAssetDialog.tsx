"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AssetType } from "@/lib/ai/types";

const COPY: Record<AssetType, { title: string; namePlaceholder: string; descPlaceholder: string }> = {
  character: {
    title: "Add a character",
    namePlaceholder: "e.g. Detective Halloran",
    descPlaceholder:
      "How they look: build, age, clothing, the one detail you'd notice first.",
  },
  location: {
    title: "Add a location",
    namePlaceholder: "e.g. The Harbour at Dawn",
    descPlaceholder: "What it looks like: time of day, weather, texture, mood.",
  },
  prop: {
    title: "Add a prop",
    namePlaceholder: "e.g. The Brass Compass",
    descPlaceholder: "The object's material, size, condition and why it matters.",
  },
};

// Modal for creating an asset by hand. Deliberately a real form rather than a
// browser prompt(): native dialogs block the page and read as unfinished.
export function NewAssetDialog({
  type,
  onCancel,
  onCreate,
}: {
  type: AssetType;
  onCancel: () => void;
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const copy = COPY[type];
  const ready = name.trim().length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold">{copy.title}</h2>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={17} />
          </button>
        </div>

        <label className="mt-5 block text-xs uppercase tracking-wide text-[var(--color-muted)]">
          Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && ready) onCreate(name.trim(), description.trim());
          }}
          placeholder={copy.namePlaceholder}
          maxLength={60}
          className="mt-2 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-3 text-sm outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
        />

        <label className="mt-4 block text-xs uppercase tracking-wide text-[var(--color-muted)]">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={copy.descPlaceholder}
          maxLength={600}
          className="scroll-thin mt-2 h-24 w-full resize-none rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-3 text-sm leading-relaxed outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
        />
        <p className="mt-2 text-xs text-[var(--color-muted-2)]">
          The description becomes the image prompt — the more specific, the better
          the result.
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => ready && onCreate(name.trim(), description.trim())}
            disabled={!ready}
          >
            <Sparkles size={14} /> Generate
          </Button>
        </div>
      </div>
    </div>
  );
}

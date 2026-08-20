"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Wand2, BookOpen, Check } from "lucide-react";
import type { Asset } from "@/lib/ai/types";
import { Spinner } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import { useCharacters } from "@/lib/store/characters";
import { useStore } from "@/lib/store/project";

// The asset detail / iterate screen: grouped asset list on the left, the
// selected asset's description, voice and visual on the right.
//
// Removed from the original: a Download button, an "Upload Reference Image"
// button, and a two-up image grid that rendered the same picture twice. None of
// them did anything; each one was a bug report waiting to be filed.
export function AssetDetail({
  assets,
  selectedId,
  onSelect,
  onBack,
  onUpdateDescription,
  onUpdateVoice,
  onIterate,
}: {
  assets: Asset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onUpdateDescription: (id: string, description: string) => void;
  onUpdateVoice: (id: string, voice: string) => void;
  onIterate: (id: string, prompt: string) => void | Promise<void>;
}) {
  const selected = assets.find((a) => a.id === selectedId);
  const [editPrompt, setEditPrompt] = useState("");

  // Clear the pending edit when switching assets, so a prompt typed for one
  // character can't be applied to another.
  useEffect(() => setEditPrompt(""), [selectedId]);

  const groups: { key: Asset["type"]; label: string }[] = [
    { key: "character", label: "Characters" },
    { key: "location", label: "Locations" },
    { key: "prop", label: "Props" },
  ];

  const upsertChar = useCharacters((s) => s.upsert);
  const pushToast = useStore((s) => s.pushToast);
  const [savedToBible, setSavedToBible] = useState(false);

  const handleSaveToBible = () => {
    if (!selected || selected.type !== "character") return;
    upsertChar({
      name: selected.name,
      description: selected.description,
      wardrobe: selected.description ? undefined : undefined,
      references: selected.image ? [selected.image] : [],
    });
    setSavedToBible(true);
    pushToast({
      message: `"${selected.name}" saved to Character Bible`,
      detail: "This character is now locked and available across all projects.",
      variant: "success",
    });
    setTimeout(() => setSavedToBible(false), 3000);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Asset list */}
      <aside className="shrink-0 overflow-y-auto scroll-thin border-b border-[var(--color-border-soft)] px-5 py-5 lg:w-[320px] lg:border-b-0 lg:border-r">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)] hover:text-white"
        >
          <ArrowLeft size={16} /> Back to all assets
        </button>
        <h2 className="mt-6 text-lg font-bold">Asset List</h2>

        {groups.map((g) => {
          const items = assets.filter((a) => a.type === g.key);
          if (items.length === 0) return null;
          return (
            <div key={g.key} className="mt-5">
              <p className="text-sm text-[var(--color-muted)]">{g.label}</p>
              <div className="mt-2 space-y-1">
                {items.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                      a.id === selectedId
                        ? "bg-[var(--color-panel)]"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-[var(--color-panel-2)]">
                      {a.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.image} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold uppercase">
                        {a.name}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                        {a.subtitle}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </aside>

      {/* Detail panel */}
      {selected && (
        <section className="flex-1 overflow-y-auto scroll-thin px-5 py-6 pb-32 sm:px-10">
          <div className="mx-auto max-w-[760px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  {selected.subtitle}
                </p>
                <h1 className="mt-1 text-2xl font-bold uppercase">{selected.name}</h1>
              </div>

              {selected.type === "character" && (
                <button
                  onClick={handleSaveToBible}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition ${
                    savedToBible
                      ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                      : "border-[var(--color-border-soft)] bg-[var(--color-panel-2)] text-[var(--color-muted)] hover:border-[var(--color-muted)] hover:text-white"
                  }`}
                >
                  {savedToBible ? (
                    <>
                      <Check size={13} className="text-emerald-400" /> Saved to Bible
                    </>
                  ) : (
                    <>
                      <BookOpen size={13} /> Save to Character Bible
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Visual */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)]">
              <div
                className={`relative flex w-full items-center justify-center ${
                  selected.type === "character" ? "aspect-[4/5]" : "aspect-[16/10]"
                }`}
              >
                {selected.status === "generating" ? (
                  <div className="flex flex-col items-center gap-3">
                    <Spinner size={24} />
                    <span className="text-xs text-[var(--color-muted)]">
                      Generating…
                    </span>
                  </div>
                ) : selected.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">No visual yet</span>
                )}
              </div>
            </div>

            {/* Iterate */}
            <div className="mt-4 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/40 p-4">
              <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <Wand2 size={13} /> Change this visual
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editPrompt.trim()) {
                      onIterate(selected.id, editPrompt.trim());
                      setEditPrompt("");
                    }
                  }}
                  placeholder="e.g. older, with a scar across the left eye"
                  className="flex-1 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)] p-2.5 text-sm outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
                />
                <Button
                  disabled={!editPrompt.trim() || selected.status === "generating"}
                  onClick={() => {
                    onIterate(selected.id, editPrompt.trim());
                    setEditPrompt("");
                  }}
                >
                  <Sparkles size={14} /> Update visual
                </Button>
              </div>
            </div>

            {/* Description */}
            <label className="mt-6 block text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Description
            </label>
            <textarea
              key={`${selected.id}-desc`}
              defaultValue={selected.description}
              onBlur={(e) => onUpdateDescription(selected.id, e.target.value)}
              placeholder="What this asset looks like…"
              className="scroll-thin mt-2 h-28 w-full resize-none rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-3 text-sm leading-relaxed outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
            />
            <p className="mt-1.5 text-xs text-[var(--color-muted-2)]">
              Saved when you click away. This text is what future generations read.
            </p>

            {/* Voice — characters only */}
            {selected.type === "character" && (
              <>
                <label className="mt-6 block text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  Voice Description
                </label>
                <input
                  key={`${selected.id}-voice`}
                  defaultValue={selected.voiceDescription ?? ""}
                  onBlur={(e) => onUpdateVoice(selected.id, e.target.value)}
                  placeholder="e.g. adult female, warm, low register, unhurried"
                  className="mt-2 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-3 text-sm outline-none placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-border)]"
                />
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

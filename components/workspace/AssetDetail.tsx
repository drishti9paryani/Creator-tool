"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ChevronUp,
  Upload,
  Sparkles,
  Pencil,
  Download,
  Wand2,
} from "lucide-react";
import type { Asset } from "@/lib/ai/types";

// The asset detail / iterate screen (Back + grouped Asset List on the left,
// description / voice / visual on the right).
export function AssetDetail({
  assets,
  selectedId,
  onSelect,
  onBack,
  onUpdateDescription,
}: {
  assets: Asset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onUpdateDescription: (id: string, description: string) => void;
}) {
  const selected = assets.find((a) => a.id === selectedId);
  const groups: { key: Asset["type"]; label: string }[] = [
    { key: "character", label: "Characters" },
    { key: "location", label: "Locations" },
    { key: "prop", label: "Props" },
  ];

  return (
    <div className="flex h-full">
      {/* Asset list */}
      <aside className="w-[340px] shrink-0 overflow-y-auto scroll-thin px-6 py-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h2 className="mt-6 text-lg font-bold">Asset List</h2>

        {groups.map((g) => {
          const items = assets.filter((a) => a.type === g.key);
          if (items.length === 0) return null;
          return (
            <div key={g.key} className="mt-5">
              <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
                <span>{g.label}</span>
                <ChevronUp size={15} />
              </div>
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
                    <span>
                      <span className="block text-[13px] font-semibold uppercase">
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
        <section className="flex-1 overflow-y-auto scroll-thin px-10 py-6">
          <div className="mx-auto max-w-[760px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  {selected.subtitle}
                </p>
                <h1 className="mt-1 text-2xl font-bold uppercase">{selected.name}</h1>
              </div>
              <button className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
                <Download size={17} />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                Description
              </label>
              <Pencil size={13} className="text-[var(--color-muted)]" />
            </div>
            <textarea
              defaultValue={selected.description}
              onBlur={(e) => onUpdateDescription(selected.id, e.target.value)}
              className="scroll-thin mt-2 h-24 w-full resize-none rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-3 text-sm leading-relaxed outline-none focus:border-[var(--color-border)]"
            />

            <div className="mt-4 flex items-center justify-between">
              <button className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
                <Upload size={14} /> Upload Reference Image
              </button>
              <button className="flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black hover:bg-white/90">
                <Sparkles size={14} /> Update Visual
              </button>
            </div>

            {selected.voiceDescription && (
              <>
                <label className="mt-6 block text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  Voice Description
                </label>
                <input
                  defaultValue={selected.voiceDescription}
                  className="mt-2 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel)]/50 p-3 text-sm outline-none focus:border-[var(--color-border)]"
                />
              </>
            )}

            <div className="mt-8 flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                Visual
              </label>
              <button className="flex items-center gap-2 rounded-full bg-[var(--color-panel-2)] px-3.5 py-1.5 text-sm hover:bg-[#26262a]">
                <Wand2 size={14} /> Edit {selected.subtitle} Design
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)]"
                >
                  {selected.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

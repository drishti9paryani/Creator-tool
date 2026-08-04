"use client";

import { Trash2, ImageOff } from "lucide-react";
import type { Asset } from "@/lib/ai/types";
import { Spinner } from "@/components/ui/Loader";

// A single asset tile (character/location/prop): image with name/subtitle below.
// Shows a spinner while generating; a hover delete button when ready.
export function AssetCard({
  asset,
  aspect = "portrait",
  onOpen,
  onDelete,
}: {
  asset: Asset;
  aspect?: "portrait" | "landscape";
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  const box =
    aspect === "portrait" ? "aspect-[3/4]" : "aspect-[16/10]";
  return (
    <div className="group flex flex-col">
      <button
        onClick={onOpen}
        className={`relative ${box} w-full overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-panel-2)]`}
      >
        {asset.status === "generating" ? (
          // Still being generated → spinner.
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        ) : asset.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.image}
            alt={asset.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          // Ready but no image (e.g. mock props without art) → placeholder, not
          // an endless spinner.
          <span className="absolute inset-0 flex items-center justify-center text-[var(--color-muted)]">
            <ImageOff size={22} />
          </span>
        )}

        {onDelete && asset.status === "ready" && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/50 text-[var(--color-muted)] opacity-0 transition hover:text-white group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </span>
        )}
      </button>

      <p className="mt-2 text-[13px] font-semibold uppercase tracking-wide">
        {asset.name}
      </p>
      <p className="text-[11px] text-[var(--color-muted)]">{asset.subtitle}</p>
    </div>
  );
}

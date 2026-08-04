"use client";

import { Plus } from "lucide-react";

// Dashed "Add …" tile at the end of an asset row.
export function AddCard({
  label,
  subtitle,
  aspect = "portrait",
  onClick,
}: {
  label: string;
  subtitle?: string;
  aspect?: "portrait" | "landscape";
  onClick?: () => void;
}) {
  const box = aspect === "portrait" ? "aspect-[3/4]" : "aspect-[16/10]";
  return (
    <div className="flex flex-col">
      <button
        onClick={onClick}
        className={`${box} flex w-full items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-muted)] hover:text-[var(--color-text)]`}
      >
        <Plus size={22} />
      </button>
      {label && (
        <>
          <p className="mt-2 text-[13px] font-semibold">{label}</p>
          {subtitle && (
            <p className="text-[11px] text-[var(--color-muted)]">{subtitle}</p>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useStore } from "@/lib/store/project";
import { Loader2, Check } from "lucide-react";

// Bottom-right transient toasts, matching the video's init / applying / saving
// notifications. Loading toasts spin; success toasts show a check.
export function Toaster() {
  const toasts = useStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in pointer-events-auto flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2.5 text-sm text-[var(--color-text)] shadow-lg shadow-black/40"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-panel-2)]">
            {t.variant === "success" ? (
              <Check size={13} className="text-emerald-400" />
            ) : (
              <Loader2 size={13} className="animate-spin text-[var(--color-muted)]" />
            )}
          </span>
          <span className="pr-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

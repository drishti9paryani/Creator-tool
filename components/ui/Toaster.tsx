"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store/project";
import { Loader2, Check, AlertTriangle, XCircle, X } from "lucide-react";
import { onDegraded } from "@/lib/ai/client";

const AUTO_DISMISS_MS: Record<string, number> = {
  success: 3200,
  warning: 8000, // longer: the tester needs time to read why output is sample data
  error: 9000,
};

// Bottom-right transient toasts.
//
// Beyond the original loading/success notifications, this is now the single
// place the app admits something went wrong. It subscribes to the AI client's
// degradation channel, so any time the server serves sample output instead of
// live generation the tester is told — silently swapping in canned data was the
// worst failure mode in the previous build.
export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);
  const pushToast = useStore((s) => s.pushToast);

  useEffect(
    () =>
      onDegraded((notes) => {
        // One toast per batch; the first reason is the informative one.
        pushToast({
          message: "Showing sample output — live generation unavailable",
          detail: notes[0]?.reason,
          variant: "warning",
        });
      }),
    [pushToast]
  );

  // Auto-dismiss everything except loading toasts (which their caller closes).
  useEffect(() => {
    const timers = toasts
      .filter((t) => t.variant && t.variant !== "loading")
      .map((t) =>
        setTimeout(() => dismissToast(t.id), AUTO_DISMISS_MS[t.variant!] ?? 4000)
      );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex max-w-[min(92vw,420px)] flex-col gap-2"
    >
      {toasts.map((t) => {
        const isProblem = t.variant === "warning" || t.variant === "error";
        return (
          <div
            key={t.id}
            className={`animate-toast-in pointer-events-auto flex items-start gap-3 border px-4 py-3 text-sm shadow-lg shadow-black/40 ${
              t.detail ? "rounded-2xl" : "rounded-full"
            } ${
              t.variant === "warning"
                ? "border-amber-500/40 bg-amber-950/70 text-amber-50"
                : t.variant === "error"
                  ? "border-red-500/40 bg-red-950/70 text-red-50"
                  : "border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text)]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                isProblem ? "bg-black/25" : "bg-[var(--color-panel-2)]"
              }`}
            >
              {t.variant === "success" ? (
                <Check size={13} className="text-emerald-400" />
              ) : t.variant === "warning" ? (
                <AlertTriangle size={13} className="text-amber-300" />
              ) : t.variant === "error" ? (
                <XCircle size={13} className="text-red-300" />
              ) : (
                <Loader2 size={13} className="animate-spin text-[var(--color-muted)]" />
              )}
            </span>

            <span className="min-w-0 flex-1 pr-1">
              <span className="block">{t.message}</span>
              {t.detail && (
                <span className="mt-1 block break-words text-xs opacity-75">
                  {t.detail}
                </span>
              )}
            </span>

            {t.variant !== "loading" && (
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="mt-0.5 shrink-0 opacity-50 transition hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, CornerDownLeft } from "lucide-react";
import { useStore } from "@/lib/store/project";
import { ai } from "@/lib/ai/client";

// Floating bottom-center AI command bar present on all workspace pages.
//
// By default it runs the provider's runCommand (an acknowledgement). Pages that
// can actually act on a prompt — the asset detail view, the shot editor — pass
// `onSubmit` so the same bar performs a real edit instead of just replying.
export function CommandBar({
  placeholder,
  onSubmit,
  submitLabel,
}: {
  placeholder: string;
  onSubmit?: (prompt: string) => void | Promise<void>;
  /** Shown in the hint row when the bar performs a real action. */
  submitLabel?: string;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pushToast = useStore((s) => s.pushToast);
  const dismissToast = useStore((s) => s.dismissToast);

  // "/" focuses the command bar from anywhere — the fastest path to the app's
  // most distinctive control, which testers otherwise never discover.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function submit() {
    const prompt = value.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setValue("");

    try {
      if (onSubmit) {
        await onSubmit(prompt);
      } else {
        const id = pushToast({ message: "Working on it…", variant: "loading" });
        const res = await ai.runCommand(prompt);
        dismissToast(id);
        pushToast({ message: res.message, variant: "success" });
      }
    } catch (e) {
      pushToast({
        message: "That command didn't go through",
        detail: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 lg:left-[210px]">
      <div className="pointer-events-auto w-full max-w-[560px]">
        <div
          className={`flex items-center gap-2 rounded-full border bg-[var(--color-panel)] py-1.5 pl-2 pr-2 shadow-lg shadow-black/40 transition ${
            busy ? "border-[var(--color-accent)]/50" : "border-[var(--color-border)]"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 ${
              busy ? "animate-pulse" : ""
            }`}
          >
            <Sparkles size={14} className="text-white" />
          </span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={busy ? "Working…" : placeholder}
            disabled={busy}
            aria-label="AI command"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)] disabled:opacity-60"
          />
          <button
            onClick={submit}
            disabled={!value.trim() || busy}
            aria-label="Run command"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition enabled:hover:text-[var(--color-text)] disabled:opacity-30"
          >
            <CornerDownLeft size={15} />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-[var(--color-muted-2)]">
          {submitLabel ?? "Press / to focus · Enter to run"}
        </p>
      </div>
    </div>
  );
}

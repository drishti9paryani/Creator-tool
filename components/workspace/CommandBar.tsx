"use client";

import { useState } from "react";
import { Sparkles, Mic } from "lucide-react";
import { useStore } from "@/lib/store/project";
import { ai } from "@/lib/ai/client";

// Floating bottom-center AI command bar present on all workspace pages.
// Submitting runs the provider's runCommand (mock: toast) — the seam where
// natural-language edits would hit a real model.
export function CommandBar({ placeholder }: { placeholder: string }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const pushToast = useStore((s) => s.pushToast);
  const dismissToast = useStore((s) => s.dismissToast);

  async function submit() {
    const prompt = value.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setValue("");
    const id = pushToast({ message: "Working on it…", variant: "loading" });
    const res = await ai.runCommand(prompt);
    dismissToast(id);
    pushToast({ message: res.message, variant: "success" });
    setTimeout(() => setBusy(false), 200);
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-[210px] right-0 z-40 flex justify-center px-6">
      <div className="pointer-events-auto flex w-full max-w-[560px] items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] py-1.5 pl-2 pr-2 shadow-lg shadow-black/40">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500">
          <Sparkles size={14} className="text-white" />
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
        />
        <button
          onClick={submit}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <Mic size={15} />
        </button>
      </div>
    </div>
  );
}

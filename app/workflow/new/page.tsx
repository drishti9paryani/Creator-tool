"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryAction } from "@/components/client-workflow/PrimaryAction";
import type { WorkflowProject } from "@/lib/workflow/types";

export default function NewWorkflowPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), source: "web" }),
      });
      const body = (await response.json()) as { project?: WorkflowProject; error?: string };
      if (!response.ok || !body.project) throw new Error(body.error ?? "This project could not be started");
      router.push(`/workflow/${body.project.id}`);
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : "The connection stopped"}. Try again.`);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#e8eef3] px-4 py-10 text-[#183247] sm:px-8 sm:py-20">
      <main className="mx-auto max-w-2xl border-l-[6px] border-[#2f6f67] bg-white px-5 py-9 shadow-[0_18px_55px_rgba(24,50,71,0.12)] sm:px-12 sm:py-12">
        <a href="/" className="text-lg font-bold text-[#15324a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f2ae30]">Creator Desk</a>
        <h1 className="mt-12 text-4xl font-bold tracking-[-0.035em] text-[#15324a] sm:text-5xl">Start a new video</h1>
        <p className="mt-5 text-lg leading-8 text-[#405b70]">Give it a short name. You will describe the idea on the next screen.</p>
        <form onSubmit={create} className="mt-8">
          <label htmlFor="workflow-title" className="block text-lg font-bold">Project name</label>
          <input
            id="workflow-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
            placeholder="For example: Sunday lunch"
            className="mt-3 min-h-14 w-full rounded-xl border-2 border-[#8ea1b2] bg-[#fbfcfd] px-5 text-lg outline-none placeholder:text-[#718598] focus:border-[#1d5b83] focus:ring-4 focus:ring-[#bdd9ec]"
          />
          {error && <p role="alert" className="mt-4 rounded-lg bg-[#fff1d2] px-4 py-3 font-semibold text-[#6d4300]">{error}</p>}
          <PrimaryAction type="submit" className="mt-8" disabled={!title.trim() || saving}>{saving ? "Starting…" : "Continue"}</PrimaryAction>
        </form>
      </main>
    </div>
  );
}
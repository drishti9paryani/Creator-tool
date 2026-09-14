"use client";

import { useState } from "react";
import { ClientStageHeader } from "@/components/client-workflow/ClientStageHeader";
import { PrimaryAction } from "@/components/client-workflow/PrimaryAction";
import { IdeaStage } from "@/components/client-workflow/stages/IdeaStage";
import { WordsStage } from "@/components/client-workflow/stages/WordsStage";
import { LookStage } from "@/components/client-workflow/stages/LookStage";
import { PreviewStage } from "@/components/client-workflow/stages/PreviewStage";
import { DeliveryStage } from "@/components/client-workflow/stages/DeliveryStage";
import { workflowClient } from "@/lib/workflow/client";
import type { WorkflowEvent, WorkflowProject } from "@/lib/workflow/types";

type ClientWorkflowProps = {
  initialProject: WorkflowProject;
  onApply?: (event: WorkflowEvent) => Promise<WorkflowProject>;
};

const HEADINGS: Record<WorkflowProject["stage"], string> = {
  idea: "Tell us your idea",
  words: "Approve the words",
  look: "Choose the look",
  preview: "Approve the preview",
  delivery: "Receive your video",
};

export function ClientWorkflow({ initialProject, onApply }: ClientWorkflowProps) {
  const [project, setProject] = useState(initialProject);
  const [idea, setIdea] = useState(initialProject.idea);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: WorkflowEvent) {
    setSaving(true);
    setError(null);
    try {
      const updated = await (onApply
        ? onApply(event)
        : workflowClient.apply(project.id, event));
      setProject(updated);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The connection stopped";
      const preserved = project.stage === "idea" ? "Your idea" : "Your work";
      setError(`${message}. ${preserved} is still here. Try again.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#e8eef3] text-[#183247]">
      <ClientStageHeader stage={project.stage} />
      <main className="mx-auto flex min-h-[calc(100vh-132px)] max-w-4xl items-start px-4 py-8 sm:px-8 sm:py-14">
        <section className="w-full border-l-[6px] border-[#2f6f67] bg-white px-5 py-8 shadow-[0_18px_55px_rgba(24,50,71,0.12)] sm:px-12 sm:py-12">
          <h1 className="max-w-2xl text-3xl font-bold tracking-[-0.035em] text-[#15324a] sm:text-5xl">
            {HEADINGS[project.stage]}
          </h1>

          {project.stage === "idea" && <IdeaStage value={idea} onChange={setIdea} />}
          {project.stage === "words" && project.script && (
            <WordsStage script={project.script} saving={saving} onSubmit={(event) => void save(event)} />
          )}
          {project.stage === "look" && (
            <LookStage
              selectedLookId={project.selectedLookId}
              saving={saving}
              onSelect={(lookId) => void save({ type: "look.selected", lookId })}
            />
          )}

          {project.stage === "preview" &&
            project.script &&
            project.maximumCostInr !== null && (
              <PreviewStage
                script={project.script}
                previewAssetIds={project.previewAssetIds}
                maximumCostInr={project.maximumCostInr}
                saving={saving}
                onSubmit={(event) => void save(event)}
              />
            )}
          {project.stage === "delivery" && (
            <DeliveryStage
              status={project.status}
              finalVideoUrl={project.finalVideoUrl}
              errorMessage={project.errorMessage}
              estimatedMinutes={4}
            />
          )}
          {error && (
            <p role="alert" className="mt-6 max-w-2xl rounded-lg bg-[#fff1d2] px-4 py-3 text-base font-semibold text-[#6d4300]">
              {error}
            </p>
          )}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[#d9e0e7] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={project.stage === "idea" || saving}
              onClick={() => window.history.back()}
              className="min-h-12 rounded-xl px-6 py-3 text-lg font-bold text-[#294b64] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1d5b83] disabled:opacity-40"
            >
              Back
            </button>
            {project.stage === "idea" && (
              <PrimaryAction
                type="button"
                disabled={!idea.trim() || saving}
                onClick={() => void save({ type: "idea.submitted", idea: idea.trim() })}
              >
                {saving ? "Saving…" : "Continue"}
              </PrimaryAction>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
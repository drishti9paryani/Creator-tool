import { createWorkflowApi } from "@/lib/workflow/http";
import type { WorkflowRepository } from "@/lib/workflow/repository";
import type { WorkflowProject } from "@/lib/workflow/types";
import type { TelegramCommand } from "@/lib/integrations/commands";

type IntegrationResult = {
  status: number;
  body: Record<string, unknown>;
};

function statusCopy(project: WorkflowProject): string {
  if (project.stage === "idea") return "I am waiting for your idea.";
  if (project.stage === "words") return "The words are ready for your review.";
  if (project.stage === "look") return "Choose the look for your video.";
  if (project.stage === "preview") return "Your preview is ready to review.";
  if (project.status === "complete") return "Your video is ready.";
  if (project.status === "failed") return "The video could not be finished. Try again or ask for help.";
  return "I am creating your video now.";
}

function projectResult(status: number, project: WorkflowProject, message: string): IntegrationResult {
  return { status, body: { message, projectId: project.id, stage: project.stage, status: project.status } };
}

export function handleTelegramCommand(
  repository: WorkflowRepository,
  command: TelegramCommand,
  projectId?: string
): IntegrationResult {
  const api = createWorkflowApi(repository);

  if (command.type === "project.create") {
    const created = api.create({ title: command.title, source: "telegram" });
    if (!created.body.project) return created;
    const project = created.body.project as WorkflowProject;
    const started = api.apply(project.id, { type: "idea.submitted", idea: command.idea });
    if (!started.body.project) return started;
    return projectResult(201, started.body.project as WorkflowProject, "I saved your idea and prepared the words for review.");
  }

  if (!projectId) return { status: 400, body: { message: "Tell me which project you want to check." } };
  const current = repository.get(projectId);
  if (!current) return { status: 404, body: { message: "This project could not be found." } };

  if (command.type === "project.status") return projectResult(200, current, statusCopy(current));
  if (command.type === "delivery.link") {
    return current.finalVideoUrl
      ? projectResult(200, current, `Your video is ready: ${current.finalVideoUrl}`)
      : { status: 409, body: { message: "Your video is not ready yet." } };
  }

  const event = command.type === "script.approve"
    ? { type: "script.approved" as const }
    : command.type === "script.revision"
      ? { type: "script.revision_requested" as const, instructions: command.instructions }
      : command.type === "look.select"
        ? { type: "look.selected" as const, lookId: command.lookId }
        : { type: "preview.approved" as const, approvedMaximumCostInr: command.maximumCostInr };
  const applied = api.apply(projectId, event);
  if (!applied.body.project) {
    return { status: applied.status, body: { message: applied.status === 409 ? "That action is not available yet." : applied.body.error ?? "This step could not be saved." } };
  }
  return projectResult(200, applied.body.project as WorkflowProject, statusCopy(applied.body.project as WorkflowProject));
}
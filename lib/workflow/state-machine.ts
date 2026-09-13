import type {
  ClientStage,
  WorkflowEvent,
  WorkflowProject,
} from "@/lib/workflow/types";

const EVENT_LABELS: Record<WorkflowEvent["type"], string> = {
  "idea.submitted": "Idea submission",
  "script.generated": "Script generation",
  "script.revision_requested": "Script revision",
  "script.approved": "Script approval",
  "look.selected": "Look selection",
  "preview.generated": "Preview generation",
  "preview.revision_requested": "Preview revision",
  "preview.approved": "Preview approval",
  "render.started": "Render start",
  "render.completed": "Render completion",
  "render.failed": "Render failure",
};

function id(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `workflow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function assertStage(
  project: WorkflowProject,
  event: WorkflowEvent,
  allowed: ClientStage[]
): void {
  if (!allowed.includes(project.stage)) {
    throw new Error(`${EVENT_LABELS[event.type]} is not allowed during ${project.stage}`);
  }
}

function requireText(value: string, label: string): string {
  const clean = value.trim();
  if (!clean) throw new Error(`${label} is required`);
  return clean;
}

export function createWorkflowProject(input: {
  title: string;
  source: WorkflowProject["source"];
}): WorkflowProject {
  const now = new Date().toISOString();
  return {
    id: id(),
    title: requireText(input.title, "Project title"),
    source: input.source,
    stage: "idea",
    status: "draft",
    idea: "",
    script: null,
    selectedLookId: null,
    previewAssetIds: [],
    maximumCostInr: null,
    approvedMaximumCostInr: null,
    finalVideoUrl: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyWorkflowEvent(
  project: WorkflowProject,
  event: WorkflowEvent
): WorkflowProject {
  const next = {
    ...project,
    updatedAt: new Date().toISOString(),
    errorMessage: null,
  };

  switch (event.type) {
    case "idea.submitted":
      assertStage(project, event, ["idea"]);
      return {
        ...next,
        idea: requireText(event.idea, "Idea"),
        status: "working",
      };
    case "script.generated":
      assertStage(project, event, ["idea", "words"]);
      return {
        ...next,
        script: requireText(event.script, "Script"),
        stage: "words",
        status: "awaiting_approval",
      };
    case "script.revision_requested":
      assertStage(project, event, ["words"]);
      requireText(event.instructions, "Revision instructions");
      return { ...next, status: "working" };
    case "script.approved":
      assertStage(project, event, ["words"]);
      if (!project.script) throw new Error("A script is required before approval");
      return { ...next, stage: "look", status: "awaiting_approval" };
    case "look.selected":
      assertStage(project, event, ["look"]);
      return {
        ...next,
        selectedLookId: requireText(event.lookId, "Look"),
        stage: "preview",
        status: "working",
      };
    case "preview.generated":
      assertStage(project, event, ["preview"]);
      if (event.assetIds.length === 0) throw new Error("At least one preview is required");
      if (!Number.isInteger(event.maximumCostInr) || event.maximumCostInr < 0) {
        throw new Error("Maximum cost must be a whole rupee amount");
      }
      return {
        ...next,
        previewAssetIds: [...event.assetIds],
        maximumCostInr: event.maximumCostInr,
        approvedMaximumCostInr: null,
        status: "awaiting_approval",
      };
    case "preview.revision_requested":
      assertStage(project, event, ["preview"]);
      requireText(event.instructions, "Revision instructions");
      return { ...next, status: "working" };
    case "preview.approved":
      assertStage(project, event, ["preview"]);
      if (project.maximumCostInr === null) {
        throw new Error("A maximum cost must be shown before approval");
      }
      if (event.approvedMaximumCostInr !== project.maximumCostInr) {
        throw new Error(
          `Approved maximum must match the shown maximum of ₹${project.maximumCostInr}`
        );
      }
      return {
        ...next,
        approvedMaximumCostInr: event.approvedMaximumCostInr,
        stage: "delivery",
        status: "working",
      };
    case "render.started":
      assertStage(project, event, ["delivery"]);
      return { ...next, status: "working" };
    case "render.completed":
      assertStage(project, event, ["delivery"]);
      return {
        ...next,
        finalVideoUrl: requireText(event.finalVideoUrl, "Final video URL"),
        status: "complete",
      };
    case "render.failed":
      assertStage(project, event, ["delivery"]);
      return {
        ...next,
        errorMessage: requireText(event.message, "Failure message"),
        status: "failed",
      };
  }
}
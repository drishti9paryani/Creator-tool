import type { StoredWorkflowEvent } from "@/lib/workflow/repository";
import type { WorkflowProject } from "@/lib/workflow/types";

export type OperatorNodeStatus = "blocked" | "waiting" | "running" | "complete" | "failed";

export type OperatorNode = {
  id: "idea" | "script" | "look" | "preview" | "render" | "delivery";
  label: string;
  status: OperatorNodeStatus;
  detail: string;
  provider?: string;
  canRetry: boolean;
};

const baseNodes: Array<Pick<OperatorNode, "id" | "label">> = [
  { id: "idea", label: "Idea" },
  { id: "script", label: "Script" },
  { id: "look", label: "Look" },
  { id: "preview", label: "Preview" },
  { id: "render", label: "Render" },
  { id: "delivery", label: "Delivery" },
];

export function buildOperatorNodes(
  project: WorkflowProject,
  _events: StoredWorkflowEvent[]
): OperatorNode[] {
  const nodes: OperatorNode[] = baseNodes.map((node) => ({
    ...node,
    status: "blocked",
    detail: "Waiting for the previous step.",
    canRetry: false,
  }));
  const byId = (id: OperatorNode["id"]) => nodes.find((node) => node.id === id)!;

  const idea = byId("idea");
  if (project.idea) {
    idea.status = "complete";
    idea.detail = project.idea;
  } else {
    idea.status = "waiting";
    idea.detail = "Waiting for the client idea.";
  }

  const script = byId("script");
  if (project.script && ["look", "preview", "delivery"].includes(project.stage)) {
    script.status = "complete";
    script.detail = "Script approved by the client.";
  } else if (project.script) {
    script.status = project.status === "working" ? "running" : "waiting";
    script.detail = project.status === "working" ? "Preparing script review." : "Waiting for client approval.";
  }

  const look = byId("look");
  if (["preview", "delivery"].includes(project.stage)) {
    look.status = "complete";
    look.detail = project.selectedLookId ?? "Look selected.";
  } else if (project.stage === "look") {
    look.status = "waiting";
    look.detail = "Waiting for the client to choose a look.";
  }

  const preview = byId("preview");
  if (project.stage === "delivery") {
    preview.status = "complete";
    preview.detail = "Preview approved by the client.";
  } else if (project.stage === "preview") {
    preview.status = project.status === "working" ? "running" : "waiting";
    preview.detail = project.maximumCostInr === null
      ? "Preparing preview."
      : `Maximum shown to client: ₹${project.maximumCostInr}`;
    preview.provider = "Demo preview provider";
  }

  const render = byId("render");
  if (project.stage === "delivery") {
    render.provider = "Configured video provider";
    if (project.status === "failed") {
      render.status = "failed";
      render.detail = project.errorMessage ?? "Render failed.";
      render.canRetry = true;
    } else if (project.status === "complete") {
      render.status = "complete";
      render.detail = "Video rendered.";
    } else {
      render.status = "running";
      render.detail = "Rendering approved preview.";
    }
  }

  const delivery = byId("delivery");
  if (project.status === "complete" && project.finalVideoUrl) {
    delivery.status = "complete";
    delivery.detail = "Video is ready to deliver.";
  } else if (project.stage === "delivery") {
    delivery.status = project.status === "failed" ? "waiting" : "running";
    delivery.detail = "Waiting for the render output.";
  }

  return nodes;
}